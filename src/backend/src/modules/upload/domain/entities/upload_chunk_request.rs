use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
pub struct UploadChunkRequest {
    pub session_id: String,
    pub chunk_index: u64,
    pub data: Vec<u8>,
}
