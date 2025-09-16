use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

#[derive(CandidType, Clone, Serialize, Deserialize, Debug)]
pub struct Transcription {
    pub job_id: String,
    pub file_id: String,
    pub text: String,
    pub language: String,
    pub created_at: u64,
    pub deleted_at: Option<u64>,
}

impl_storable!(Transcription);
