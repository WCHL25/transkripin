use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, CandidType, Deserialize, Serialize)]
pub struct FileChunk {
    pub id: String,
    pub chunk_index: u64,
}

impl_storable!(FileChunk);
