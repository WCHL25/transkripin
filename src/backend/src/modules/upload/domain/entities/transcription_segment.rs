use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionSegment {
    pub id: u32,
    pub start: f32,
    pub end: f32,
    pub text: String,
}

impl_storable!(TranscriptionSegment);
