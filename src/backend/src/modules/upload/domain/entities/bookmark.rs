use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Bookmark {
    pub user: Principal,
    pub file_id: String,
}

impl_storable!(Bookmark);
