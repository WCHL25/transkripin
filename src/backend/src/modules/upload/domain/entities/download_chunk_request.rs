use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
pub struct DownloadChunkRequest {
    pub file_id: String,
    pub start: u64,
    pub length: u64,
}
