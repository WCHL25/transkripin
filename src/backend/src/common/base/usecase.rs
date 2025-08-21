use candid::Principal;

pub enum AuthenticationRequirement {
  Required,
  Optional,
}

impl Default for AuthenticationRequirement {
  fn default() -> Self {
    AuthenticationRequirement::Optional
  }
}

pub trait UseCase {
  fn call(&self) -> String;
}

pub trait UseCaseRequireAuth {
  fn call(&self, authentication_requirement: AuthenticationRequirement) -> String;
  fn is_anonymous(&self, principal: Principal) -> bool;
  fn handle_anonymous(&self) -> String;
}

pub async fn usecase<T>(usecase: T) -> String where T: UseCase {
  usecase.call()
}

pub async fn usecase_require_auth<T>(usecase: T) -> String where T: UseCaseRequireAuth {
  usecase.call(AuthenticationRequirement::Required)
}
