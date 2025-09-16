use candid::CandidType;
use serde::Deserialize;

use crate::impl_storable;

#[derive(CandidType, Deserialize)]
pub enum LanguageFilter {
    English,
    Indonesia,
}

impl_storable!(LanguageFilter);
