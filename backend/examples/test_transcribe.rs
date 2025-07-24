use backend::transcribe::{ extract_audio, whisper_transcribe }; // adjust module path
use std::path::Path;

#[tokio::main]
async fn main() {
    let video_path = "backend/assets/video/sample.mp4";
    assert!(Path::new(video_path).exists(), "Video file not found!");

    println!("Extracting audio...");
    let audio_data = extract_audio(video_path).expect("Failed to extract audio");

    println!("Running Whisper transcription...");
    match whisper_transcribe(audio_data).await {
        Ok(text) => println!("Transcription:\n{}", text),
        Err(e) => eprintln!("Transcription failed: {}", e),
    }
}
