use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::{ impl_storable, modules::upload::domain::entities::FileArtifact };

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct FileArtifactWithMeta {
    pub artifact: FileArtifact,
    pub is_bookmarked: bool,
}

impl_storable!(FileArtifactWithMeta);
