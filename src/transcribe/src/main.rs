use axum::{ extract::{ Multipart, DefaultBodyLimit }, routing::post, Json, Router };
use serde::Serialize;
use std::net::SocketAddr;

mod modules;

use modules::whisper;

#[derive(Serialize)]
struct TranscriptionResponse {
    text: String,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/transcribe", post(transcribe_handler))
        .layer(DefaultBodyLimit::max(1024 * 1024 * 100));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running at http://{}", addr);

    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app).await.unwrap();
}

async fn transcribe_handler(mut multipart: Multipart) -> Json<TranscriptionResponse> {
    let mut video_data = Vec::new();

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        if field.name() == Some("file") {
            let mut field_reader = field;
            while let Ok(Some(chunk)) = field_reader.chunk().await {
                video_data.extend_from_slice(&chunk);
            }
        }
    }

    if video_data.is_empty() {
        return Json(TranscriptionResponse { text: "No video uploaded".into() });
    }

    let text = whisper
        ::whisper_transcribe(video_data).await
        .unwrap_or_else(|e| format!("Transcription failed: {}", e));

    Json(TranscriptionResponse { text })
}
