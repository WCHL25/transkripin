use candid::{ CandidType, Principal };
use serde::Deserialize;

use crate::impl_storable;

#[derive(CandidType, Deserialize, Clone)]
pub struct UploadedFile {
    pub id: String,
    pub filename: String,
    pub content_type: String,
    pub size: u64,
    pub data: Vec<u8>,
    pub owner: Principal,
    pub uploaded_at: u64,
}

impl_storable!(UploadedFile);
