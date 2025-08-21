use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::to_json_format;

#[derive(CandidType, Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub data: Option<T>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub message: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
  pub fn success(data: T, message: impl Into<String>) -> Self {
    ApiResponse {
      data: Some(data),
      message: Some(message.into()),
    }
  }

  pub fn success_message(message: impl Into<String>) -> Self {
    ApiResponse {
      data: None,
      message: Some(message.into()),
    }
  }

  pub fn error(message: impl Into<String>) -> Self {
    ApiResponse {
      data: None,
      message: Some(message.into()),
    }
  }
}

impl ApiResponse<()> {
  pub fn error_message(message: impl Into<String>) -> String {
    let error = Self::error(message);
    to_json_format(&error)
  }
}
