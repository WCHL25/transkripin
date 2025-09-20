use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::{ impl_storable, modules::{ upload::domain::entities::Transcription, Summary } };

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct FinalResult {
    pub file_id: String,
    pub filename: String,
    pub content_type: String,
    pub size: u64,
    pub owner: Principal,
    pub uploaded_at: u64,
    pub transcription: Option<Transcription>,
    pub summary: Option<Summary>,
}

impl_storable!(FinalResult);
