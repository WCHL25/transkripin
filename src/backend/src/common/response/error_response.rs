use candid::CandidType;
use serde::{ Deserialize, Serialize };
use thiserror::Error;

#[derive(CandidType, Serialize, Deserialize, Debug, Error)]
pub enum ErrorResponse {
    #[error("Input Validation Error, Please fill all the input")] MissingRequiredField,
    #[error("Invalid Date Error, Please make sure the date time is correct")] InvalidDate,
    #[error("Invalid Format Error, Please make sure the format is correct")] InvalidFormat,
}
