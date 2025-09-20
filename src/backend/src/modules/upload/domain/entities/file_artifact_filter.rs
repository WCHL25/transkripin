use candid::CandidType;
use serde::Deserialize;

use crate::impl_storable;

use super::{ SortOrderFilter, FileTypeFilter, LanguageFilter };

#[derive(Clone, CandidType, Deserialize)]
pub struct FileArtifactFilter {
    pub sort: Option<SortOrderFilter>,
    pub file_type: Option<FileTypeFilter>,
    pub language: Option<LanguageFilter>,
    pub search: Option<String>,
}

impl_storable!(FileArtifactFilter);
