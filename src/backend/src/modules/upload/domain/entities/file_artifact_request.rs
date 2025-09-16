use candid::CandidType;
use serde::Deserialize;

use super::{ Summary, Transcription };

#[derive(CandidType, Deserialize)]
pub struct FileArtifactRequest {
    pub file_id: String,
    pub title: Option<String>,
    pub transcription: Option<Transcription>,
    pub summary: Option<Summary>,
}
