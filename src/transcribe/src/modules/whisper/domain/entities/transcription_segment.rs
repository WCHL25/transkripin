use serde::{ Deserialize, Serialize };

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionSegment {
    pub id: u32,
    pub start: f32,
    pub end: f32,
    pub text: String,
}
