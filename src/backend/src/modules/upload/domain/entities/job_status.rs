use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
#[serde(tag = "status", content = "data")]
pub enum JobStatus {
    Pending,
    Completed(String),
    Failed(String),
}
