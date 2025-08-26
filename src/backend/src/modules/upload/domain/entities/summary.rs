use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

#[derive(CandidType, Clone, Serialize, Deserialize, Debug)]
pub struct Summary {
    pub file_id: String,
    pub text: String,
    pub created_at: u64,
}

impl_storable!(Summary);
