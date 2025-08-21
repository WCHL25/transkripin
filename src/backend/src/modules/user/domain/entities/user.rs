use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::impl_storable;

use super::{ UserSession };

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub user_id: String,
    pub session: Option<UserSession>,
}

impl User {
    pub fn new(user_id: String, session: Option<UserSession>) -> Self {
        Self { user_id, session }
    }
}

impl_storable!(User);
