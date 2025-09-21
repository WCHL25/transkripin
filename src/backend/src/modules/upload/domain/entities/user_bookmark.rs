use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserBookmarks {
    pub user: Principal,
    pub file_ids: Vec<String>,
}

impl_storable!(UserBookmarks);
