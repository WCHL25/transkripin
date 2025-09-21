use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::{ impl_storable, modules::upload::domain::entities::FileArtifact };

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct UserFileArtifact {
    pub artifact: FileArtifact,
    pub is_bookmarked: bool, // whether the user has bookmarked the file
}

impl_storable!(UserFileArtifact);
