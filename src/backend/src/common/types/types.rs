use std::collections::HashMap;

use crate::modules::upload::domain::entities::upload_file::UploadedFile;
use crate::modules::upload::domain::entities::upload_session::UploadSession;

pub type StorageKey = [u8; 32];
pub type FixedString = [u8; 32];

pub type UploadSessions = HashMap<String, UploadSession>;
pub type UploadedFiles = HashMap<String, UploadedFile>;
pub type Transcriptions = HashMap<String, String>;
pub type Jobs = HashMap<String, String>;
pub type Summaries = HashMap<String, Option<String>>;
