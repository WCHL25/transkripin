use candid::{ CandidType, Deserialize, Principal };
use ic_cdk::api::time;
use serde::Serialize;

use crate::{ common::*, impl_storable, DEFAULT_EXPIRED_SESSION };

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserSession {
  pub principal: Principal,
  #[serde(serialize_with = "serialize_timestamp")]
  pub expired_at: u64,
}

impl UserSession {
  pub fn new(principal: Principal) -> Self {
    UserSession { principal, expired_at: time() + DEFAULT_EXPIRED_SESSION }
  }

  pub fn is_session_expired(&self) -> bool {
    return self.expired_at < time();
  }
}

impl_storable!(UserSession);
