use axum::{ extract::Multipart, routing::post, Router, Json };
use serde::Serialize;
use std::{ fs, io::Write, net::SocketAddr, path::PathBuf, time::Duration };
use tower_http::timeout::TimeoutLayer;

mod modules;
use modules::whisper;

#[derive(Serialize)]
struct TranscriptionResponse {
    text: String,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/upload_chunk", post(upload_chunk))
        .route("/finalize_upload", post(finalize_upload))
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

async fn finalize_upload(Json(data): Json<serde_json::Value>) -> Json<TranscriptionResponse> {
    let session_id = data["session_id"].as_str().unwrap();
    let dir = PathBuf::from("uploads").join(session_id);

    let mut combined = Vec::new();
    let mut chunk_files: Vec<_> = fs
        ::read_dir(&dir)
        .unwrap()
        .map(|f| f.unwrap().path())
        .collect();

    // Sort by chunk index
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

    println!(
        "Session {}: {} bytes combined from {} chunks",
        session_id,
        combined.len(),
        chunk_files.len()
    );

    if combined.is_empty() {
        return Json(TranscriptionResponse {
            text: "No data found after combining chunks.".to_string(),
        });
    }

    let text = whisper
        ::whisper_transcribe(combined).await
        .unwrap_or_else(|e| format!("Transcription failed: {}", e));

    println!("Whisper returned: {}", text);

    Json(TranscriptionResponse { text })
}
