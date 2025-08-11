use std::process::{ Command, Stdio };
use std::io::{ Read, Write };
use whisper_rs::{ WhisperContext, WhisperContextParameters, FullParams, SamplingStrategy };
use tempfile::NamedTempFile;

use anyhow::{ anyhow, Result };
use std::io;

pub fn extract_audio_from_video(video_data: &[u8]) -> io::Result<Vec<u8>> {
    // Save video data to a temp file
    let mut temp_video = NamedTempFile::new()?;
    temp_video.write_all(video_data)?;

    // ffmpeg command: extract mono 16kHz WAV to stdout
    let mut cmd = Command::new("ffmpeg")
        .args([
            "-i",
            temp_video.path().to_str().unwrap(),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-f",
            "wav",
            "pipe:1",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()?;

    let mut buf = Vec::new();
    if let Some(mut out) = cmd.stdout.take() {
        out.read_to_end(&mut buf)?;
    }
    cmd.wait()?;
    Ok(buf)
}

pub async fn whisper_transcribe(video_data: Vec<u8>) -> Result<String> {
    // Convert video to audio
    let audio_wav = extract_audio_from_video(&video_data)?;

    let pcm = extract_chunks(&audio_wav);

    let path_to_model = "src/transcribe/assets/models/ggml-base.en.bin";
    let ctx = WhisperContext::new_with_params(
        path_to_model,
        WhisperContextParameters::default()
    ).map_err(|e| anyhow!("Model load failed: {}", e))?;

    let mut state = ctx.create_state().map_err(|e| anyhow!("Failed to create state: {}", e))?;

    let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
    params.set_n_threads(4);
    params.set_translate(false);
    params.set_language(Some("en"));

    state.full(params, &pcm).map_err(|e| anyhow!("Transcription failed: {}", e))?;

    let num = state.full_n_segments().map_err(|e| anyhow!("Fetching segments failed: {}", e))?;
    let mut text = String::new();
    for i in 0..num {
        let seg = state.full_get_segment_text(i).unwrap_or_default();
        text.push_str(&seg);
        text.push(' ');
    }
    Ok(text.trim().to_owned())
}

fn extract_chunks(data: &[u8]) -> Vec<f32> {
    data.chunks_exact(2)
        .map(|b| (i16::from_le_bytes([b[0], b[1]]) as f32) / (i16::MAX as f32))
        .collect()
}
