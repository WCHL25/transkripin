use candid::Principal;

use crate::{ ServiceResponse, UserSession };

pub trait UserRepository {
    fn login(&self, principal: Principal) -> ServiceResponse<UserSession>;
    fn logout(&self, principal: Principal) -> ServiceResponse<String>;
    fn create_session(&self, principal: Principal) -> UserSession;
    fn get_user_id(&self, principal: &Principal) -> Option<String>;
    fn get_or_create_user_id(&self, principal: &Principal) -> String;
}
