use std::sync::Arc;

use candid::Principal;

use crate::{
  common::{
    utils::json_formatter::to_json_format,
    response::ApiResponse,
    base::usecase::{ UseCaseRequireAuth, AuthenticationRequirement },
  },
  modules::user::domain::service::{ UserService, UserServiceTrait },
};

pub struct LogoutUsecase {
  user_service: Arc<UserService>,
}

impl LogoutUsecase {
  pub fn new(user_service: Arc<UserService>) -> Self {
    LogoutUsecase { user_service }
  }
}

impl UseCaseRequireAuth for LogoutUsecase {
  fn call(&self, authentication_requirement: AuthenticationRequirement) -> String {
    let principal = ic_cdk::caller();
    match authentication_requirement {
      AuthenticationRequirement::Required if self.is_anonymous(principal) =>
        self.handle_anonymous(),
      _ => {
        let response = self.user_service.logout(principal);
        to_json_format(&response)
      }
    }
  }

  fn is_anonymous(&self, principal: Principal) -> bool {
    principal == Principal::anonymous()
  }

  fn handle_anonymous(&self) -> String {
    return ApiResponse::error_message("Anonymous users cannot access this service.");
  }
}
