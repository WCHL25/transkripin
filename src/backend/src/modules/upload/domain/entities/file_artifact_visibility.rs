use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize, PartialEq, Eq)]
pub enum FileArtifactVisibility {
    Public,
    Private,
}

impl FileArtifactVisibility {
    pub fn is_public(&self) -> bool {
        matches!(self, FileArtifactVisibility::Public)
    }
}

impl_storable!(FileArtifactVisibility);
