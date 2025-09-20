use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

#[derive(CandidType, Clone, Serialize, Deserialize, Debug)]
pub struct LlmResponse {
    pub title: String,
    pub summary: String,
}

impl_storable!(LlmResponse);
