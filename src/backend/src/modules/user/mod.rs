use std::sync::Arc;
use candid::Principal;
use lazy_static::lazy_static;
use ic_cdk::{ query, update };

pub mod application;
pub mod domain;
pub mod infrastructure;

/// IN-CODE
pub use application::*;
pub use domain::*;
pub use infrastructure::*;

use crate::common::*;

lazy_static! {
    static ref USER_REPOSITORY: Arc<UserRepositoryImpl> = Arc::new(UserRepositoryImpl);
    static ref USER_SERVICE: Arc<UserService> = Arc::new(
        UserService::new(Arc::clone(&USER_REPOSITORY))
    );
}

fn user_service() -> Arc<UserService> {
    Arc::clone(&USER_SERVICE)
}

#[query]
pub async fn get_user_id(principal: Principal) -> String {
    let user_service = user_service();
    let user_usecase = GetUserIdUsecase::new(user_service, principal);

    usecase(user_usecase).await
}

#[update]
pub async fn login() -> String {
    let user_service = user_service();
    let login_usecase = LoginUsecase::new(user_service);

    usecase_require_auth(login_usecase).await
}

#[update]
pub async fn logout() -> String {
    let user_service = user_service();
    let logout_usecase = LogoutUsecase::new(user_service);

    usecase_require_auth(logout_usecase).await
}
