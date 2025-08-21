use axum::{ extract::{ Multipart, Path }, routing::{ post, get }, Router, Json };
use serde::{ Serialize, Deserialize };
use std::{
    collections::HashMap,
    fs,
    io::Write,
    net::SocketAddr,
    path::PathBuf,
    time::Duration,
    sync::Mutex,
};
use tower_http::timeout::TimeoutLayer;
use once_cell::sync::Lazy;
use tokio::task;

mod modules;
use modules::whisper;

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "status", content = "data")]
enum JobStatus {
    Pending,
    Completed(String),
    Failed(String),
}

static JOBS: Lazy<Mutex<HashMap<String, JobStatus>>> = Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Serialize)]
struct UploadResponse {
    message: String,
}

#[derive(Serialize)]
struct TranscriptionResponse {
    text: String,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/upload_chunk", post(upload_chunk))
        .route("/finalize_upload", post(finalize_upload))
        .route("/status/{job_id}", get(check_status))
        .route("/result/{job_id}", get(get_result))
        .layer(TimeoutLayer::new(Duration::from_secs(120)));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running at http://{}", addr);

    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app).await.unwrap();
}

async fn upload_chunk(mut multipart: Multipart) -> String {
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

    let dir = PathBuf::from("uploads").join(&session_id);
    fs::create_dir_all(&dir).unwrap();
    let chunk_path = dir.join(format!("chunk_{:04}.part", chunk_index));

    let mut file = fs::File::create(chunk_path).unwrap();
    file.write_all(&chunk_data).unwrap();

    format!("Chunk {} for session {} uploaded", chunk_index, session_id)
}

async fn finalize_upload(Json(data): Json<serde_json::Value>) -> Json<UploadResponse> {
    let session_id = data["session_id"].as_str().unwrap().to_string();
    let job_id = uuid::Uuid::new_v4().to_string();
    let job_id_clone = job_id.clone();

    {
        let mut jobs = JOBS.lock().unwrap();
        jobs.insert(job_id.clone(), JobStatus::Pending);
    }

    task::spawn(async move {
        let dir = PathBuf::from("uploads").join(&session_id);

        let mut combined = Vec::new();
        let mut chunk_files: Vec<_> = fs
            ::read_dir(&dir)
            .unwrap()
            .map(|f| f.unwrap().path())
            .collect();

        chunk_files.sort_by_key(|p| {
            p.file_name()
                .unwrap()
                .to_string_lossy()
                .trim_start_matches("chunk_")
                .trim_end_matches(".part")
                .parse::<u32>()
                .unwrap_or(0)
        });

        for path in &chunk_files {
            let bytes = fs::read(path).unwrap();
            combined.extend(bytes);
        }

        if combined.is_empty() {
            let mut jobs = JOBS.lock().unwrap();
            jobs.insert(
                job_id_clone,
                JobStatus::Failed("No data found after combining chunks.".to_string())
            );
            return;
        }

        match whisper::whisper_transcribe(combined).await {
            Ok(text) => {
                let mut jobs = JOBS.lock().unwrap();
                jobs.insert(job_id_clone, JobStatus::Completed(text));
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

async fn check_status(Path(job_id): Path<String>) -> Json<JobStatus> {
    let jobs = JOBS.lock().unwrap();

    jobs.get(&job_id)
        .cloned()
        .map(Json)
        .unwrap_or(Json(JobStatus::Failed("Job not found".to_string())))
}

async fn get_result(Path(job_id): Path<String>) -> Json<TranscriptionResponse> {
    let jobs = JOBS.lock().unwrap();
    match jobs.get(&job_id) {
        Some(JobStatus::Completed(text)) => { Json(TranscriptionResponse { text: text.clone() }) }
        Some(JobStatus::Failed(err)) => {
            Json(TranscriptionResponse { text: format!("Error: {}", err) })
        }
        _ => Json(TranscriptionResponse { text: "Job is still pending.".to_string() }),
    }
}
