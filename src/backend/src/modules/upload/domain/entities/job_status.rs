use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
pub enum JobStatus {
    Pending,
    Completed(String),
    Failed(String),
}
