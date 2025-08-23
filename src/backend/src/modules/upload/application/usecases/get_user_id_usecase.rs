use std::sync::Arc;

use candid::Principal;

use crate::common::*;
use crate::modules::user::{ UserService, UserServiceTrait };

pub struct GetUserIdUsecase {
  user_service: Arc<UserService>,
  principal: Principal,
}

impl GetUserIdUsecase {
  pub fn new(user_service: Arc<UserService>, principal: Principal) -> Self {
    GetUserIdUsecase { user_service, principal }
  }
}

impl UseCase for GetUserIdUsecase {
  fn call(&self) -> String {
    let response = self.user_service.get_user_id(&self.principal.clone());
    to_json_format(&response)
  }
}
