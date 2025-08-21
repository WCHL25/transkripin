use candid::{ CandidType, Principal };
use serde::Deserialize;

#[derive(CandidType, Deserialize, Clone)]
pub struct UploadSession {
    pub id: String,
    pub filename: String,
    pub content_type: String,
    pub total_size: u64,
    pub total_chunks: u64,
    pub uploaded_chunks: Vec<Vec<u8>>,
    pub owner: Principal,
    pub created_at: u64,
}
