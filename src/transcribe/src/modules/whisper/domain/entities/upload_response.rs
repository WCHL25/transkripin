use serde::{ Deserialize, Serialize };

#[derive(Serialize, Deserialize)]
pub struct UploadResponse {
    pub message: String,
}
