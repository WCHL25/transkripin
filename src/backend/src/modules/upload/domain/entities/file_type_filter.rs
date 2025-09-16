use candid::CandidType;
use serde::Deserialize;

use crate::impl_storable;

#[derive(CandidType, Deserialize)]
pub enum FileTypeFilter {
    Video,
    Audio,
}

impl_storable!(FileTypeFilter);
