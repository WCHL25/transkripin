use std::sync::Arc;

use candid::Principal;

use crate::{
    common::response::{ ApiResponse, ServiceResponse::{ Error, Success } },
    modules::user::{ UserRepository, UserRepositoryImpl, UserSession },
};

pub struct UserService {
    user_repository: Arc<UserRepositoryImpl>,
}

pub trait UserServiceTrait {
    fn new(user_repository: Arc<UserRepositoryImpl>) -> Self;
    fn login(&self, principal: Principal) -> ApiResponse<UserSession>;
    fn logout(&self, principal: Principal) -> ApiResponse<String>;
    fn get_user_id(&self, principal: &Principal) -> Option<String>;
}

impl UserServiceTrait for UserService {
    fn new(user_repository: Arc<UserRepositoryImpl>) -> Self {
        UserService { user_repository }
    }

    fn login(&self, principal: Principal) -> ApiResponse<UserSession> {
        let login = self.user_repository.login(principal);

        match login {
            Success(session) => ApiResponse::success(session, "Login successful"),
            Error(failure) => ApiResponse::error(failure),
        }
    }

    fn logout(&self, principal: Principal) -> ApiResponse<String> {
        let logout = self.user_repository.logout(principal);

        match logout {
            Success(message) => ApiResponse::success_message(message),
            Error(failure) => ApiResponse::error(failure),
        }
    }

    fn get_user_id(&self, principal: &Principal) -> Option<String> {
        self.user_repository.get_user_id(principal)
    }
}
