use candid::CandidType;

#[derive(CandidType)]
pub struct DownloadChunkResponse {
    pub data: Vec<u8>,
    pub total_size: u64,
}
