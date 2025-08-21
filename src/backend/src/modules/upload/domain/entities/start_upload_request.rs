use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
pub struct StartUploadRequest {
    pub filename: String,
    pub content_type: String,
    pub total_size: u64,
    pub total_chunks: u64,
}
