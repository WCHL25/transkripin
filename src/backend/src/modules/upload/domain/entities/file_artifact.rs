use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::{
    impl_storable,
    modules::upload::domain::entities::{ Transcription, Summary, FileArtifactVisibility },
};

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct FileArtifact {
    pub file_id: String,
    pub filename: String,
    pub content_type: String,
    pub size: u64,
    pub owner: Principal,
    pub title: Option<String>,
    pub transcription: Option<Transcription>,
    pub summary: Option<Summary>,
    pub created_at: u64,
    pub deleted_at: Option<u64>,
    pub visibility: FileArtifactVisibility,
}

impl_storable!(FileArtifact);
