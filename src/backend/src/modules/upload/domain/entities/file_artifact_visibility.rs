use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize, PartialEq, Eq)]
pub enum FileArtifactVisibility {
    Public,
    Private,
}

impl_storable!(FileArtifactVisibility);
