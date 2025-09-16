use axum::{ extract::{ Multipart, Path }, routing::{ post, get }, Router, Json };
use serde::{ Serialize, Deserialize };
use std::{ collections::HashMap, net::SocketAddr, time::Duration, sync::{ Arc, Mutex } };
use tower_http::timeout::TimeoutLayer;
use once_cell::sync::Lazy;
use tokio::task;

mod modules;

use modules::*;

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "status", content = "data")]
enum JobStatus {
    Pending,
    Completed(String),
    Failed(String),
}

static JOBS: Lazy<Mutex<HashMap<String, JobStatus>>> = Lazy::new(|| Mutex::new(HashMap::new()));

static UPLOAD_SESSIONS: Lazy<Arc<Mutex<HashMap<String, Vec<Vec<u8>>>>>> = Lazy::new(||
    Arc::new(Mutex::new(HashMap::new()))
);

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/upload_chunk", post(upload_chunk))
        .route("/finalize_upload", post(finalize_upload))
        .route("/status/{job_id}", get(check_job_status))
        .route("/result/{job_id}", get(transcription_result))
        .layer(TimeoutLayer::new(Duration::from_secs(120)));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running at http://{}", addr);

    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app).await.unwrap();
}

pub async fn upload_chunk(mut multipart: Multipart) -> String {
    let mut session_id = String::new();
    let mut chunk_index = 0;
    let mut chunk_data = Vec::new();

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        match field.name() {
            Some("session_id") => {
                session_id = field.text().await.unwrap();
            }
            Some("chunk_index") => {
                chunk_index = field.text().await.unwrap().parse().unwrap();
            }
            Some("file") => {
                let mut f = field;
                while let Ok(Some(chunk)) = f.chunk().await {
                    chunk_data.extend_from_slice(&chunk);
                }
            }
            _ => {}
        }
    }

    let mut sessions = UPLOAD_SESSIONS.lock().unwrap();
    let entry = sessions.entry(session_id.clone()).or_default();
    if entry.len() <= chunk_index {
        entry.resize(chunk_index + 1, Vec::new());
    }
    entry[chunk_index] = chunk_data;

    format!("Chunk {} for session {} uploaded", chunk_index, session_id)
}

pub async fn finalize_upload(Json(data): Json<serde_json::Value>) -> Json<UploadResponse> {
    let session_id = data["session_id"].as_str().unwrap().to_string();
    let job_id = uuid::Uuid::new_v4().to_string();
    let job_id_clone = job_id.clone();

    {
        let mut jobs = JOBS.lock().unwrap();
        jobs.insert(job_id.clone(), JobStatus::Pending);
    }

    task::spawn(async move {
        // Take chunks out while holding the lock, then drop lock
        let chunks = {
            let mut sessions = UPLOAD_SESSIONS.lock().unwrap();
            sessions.remove(&session_id)
        };

        if chunks.is_none() {
            let mut jobs = JOBS.lock().unwrap();
            jobs.insert(job_id_clone, JobStatus::Failed("No chunks found".to_string()));
            return;
        }

        let combined: Vec<u8> = chunks.unwrap().into_iter().flatten().collect();

        if combined.is_empty() {
            let mut jobs = JOBS.lock().unwrap();
            jobs.insert(job_id_clone, JobStatus::Failed("No data after combining".to_string()));
            return;
        }

        // now safe to await
        match whisper::whisper_transcribe(combined).await {
            Ok(result) => {
                let mut jobs = JOBS.lock().unwrap();
                jobs.insert(
                    job_id_clone,
                    JobStatus::Completed(serde_json::to_string(&result).unwrap())
                );
            }
            Err(e) => {
                let mut jobs = JOBS.lock().unwrap();
                jobs.insert(
                    job_id_clone,
                    JobStatus::Failed(format!("Transcription failed: {}", e))
                );
            }
        }
    });

    Json(UploadResponse {
        message: format!("Job started with ID: {}", job_id),
    })
}

async fn check_job_status(Path(job_id): Path<String>) -> Json<JobStatus> {
    let jobs: std::sync::MutexGuard<'_, HashMap<String, JobStatus>> = JOBS.lock().unwrap();

    jobs.get(&job_id)
        .cloned()
        .map(Json)
        .unwrap_or(Json(JobStatus::Failed("Job not found".to_string())))
}

async fn transcription_result(Path(job_id): Path<String>) -> Json<TranscriptionResponse> {
    let jobs = JOBS.lock().unwrap();

    match jobs.get(&job_id) {
        Some(JobStatus::Completed(result_json)) => {
            // Deserialize stored JSON back into TranscriptionResponse
            let result: TranscriptionResponse = serde_json
                ::from_str(result_json)
                .unwrap_or(TranscriptionResponse {
                    text: "Failed to parse result".to_string(),
                    language: "unknown".to_string(),
                    segments: vec![],
                });
            Json(result)
        }
        Some(JobStatus::Failed(err)) =>
            Json(TranscriptionResponse {
                text: format!("Error: {}", err),
                language: "unknown".to_string(),
                segments: vec![],
            }),
        _ =>
            Json(TranscriptionResponse {
                text: "Job is still pending.".to_string(),
                language: "unknown".to_string(),
                segments: vec![],
            }),
    }
}
