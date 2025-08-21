use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

#[derive(CandidType, Clone, Serialize, Deserialize, Debug)]
pub struct CreateUserParams {
  pub user_id: String,
  pub principal: Principal,
}
