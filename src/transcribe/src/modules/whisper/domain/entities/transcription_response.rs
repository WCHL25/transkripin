use serde::{ Deserialize, Serialize };

use super::TranscriptionSegment;

#[derive(Serialize, Deserialize)]
pub struct TranscriptionResponse {
    pub text: String,
    pub language: String,
    pub segments: Vec<TranscriptionSegment>,
}
