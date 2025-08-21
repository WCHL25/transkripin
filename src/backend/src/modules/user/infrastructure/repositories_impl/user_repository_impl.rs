use candid::Principal;

use crate::{
    common::{ response::*, utils::{ generate_id, string_to_fixed } },
    modules::user::domain::{ User, UserRepository, UserSession },
    PRINCIPALS,
    USERS,
};

pub struct UserRepositoryImpl;

impl UserRepository for UserRepositoryImpl {
    fn login(&self, principal: Principal) -> ServiceResponse<UserSession> {
        let session = self.create_session(principal);
        let user_id = self.get_or_create_user_id(&principal);
        let key = string_to_fixed(&user_id);

        let result = USERS.with(|users| {
            let mut users = users.borrow_mut();
            let user_data = if let Some(mut user) = users.get(&key) {
                // Check if there's an active session
                if let Some(existing_session) = &user.session {
                    if !existing_session.is_session_expired() {
                        return Some(
                            ServiceResponse::Error(
                                "There is an active session with this user, please make sure there is only one device at a time.".to_string()
                            )
                        );
                    }
                }
                // Update or set the session for the user
                user.session = Some(session.clone());
                user
            } else {
                // Create a new user with the session
                let new_user: User = User::new(user_id, Some(session.clone()));
                new_user
            };
            users.insert(key, user_data);
            None
        });

        // If an error occurred, return it; otherwise, return the success response
        result.unwrap_or_else(|| ServiceResponse::Success(session))
    }

    fn logout(&self, principal: Principal) -> ServiceResponse<String> {
        let user_id = self.get_or_create_user_id(&principal);
        let key = string_to_fixed(&user_id);

        let result = USERS.with_borrow_mut(|users| {
            if let Some(mut user) = users.get(&key) {
                // Update or set the sessioThere is an active session with this usern for the user
                user.session = None;
                users.insert(key, user);
            }

            None
        });

        // If an error occurred, return it; otherwise, return the success response
        result.unwrap_or_else(|| ServiceResponse::Success("Logout Success".to_string()))
    }

    fn get_or_create_user_id(&self, principal: &Principal) -> String {
        PRINCIPALS.with(|principals| {
            let mut principals = principals.borrow_mut();
            match principals.get(principal) {
                Some(user_id) => user_id.clone(),
                None => {
                    let new_user_id = generate_id();
                    principals.insert(*principal, new_user_id.clone());
                    new_user_id
                }
            }
        })
    }

    fn get_user_id(&self, principal: &Principal) -> Option<String> {
        PRINCIPALS.with(|principals| {
            let principals = principals.borrow();

            match principals.get(principal) {
                Some(user_id) => Some(user_id.clone()),
                None => None,
            }
        })
    }

    fn create_session(&self, principal: Principal) -> UserSession {
        UserSession::new(principal)
    }
}
