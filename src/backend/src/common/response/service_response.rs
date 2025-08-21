use candid::CandidType;
use serde::{ Deserialize, Serialize };

#[derive(CandidType, Serialize, Deserialize)]
pub enum ServiceResponse<T> {
    Success(T),
    Error(String),
}
