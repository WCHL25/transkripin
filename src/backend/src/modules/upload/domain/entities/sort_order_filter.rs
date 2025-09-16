use candid::CandidType;
use serde::Deserialize;

use crate::impl_storable;

#[derive(CandidType, Deserialize)]
pub enum SortOrderFilter {
    Newest,
    Oldest,
    AlphabeticalAsc,
    AlphabeticalDesc,
}

impl_storable!(SortOrderFilter);
