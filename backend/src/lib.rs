use candid::{ CandidType, Deserialize, Principal };
use ic_cdk::{ api, update, query };
use std::collections::HashMap;
use std::cell::RefCell;

pub mod transcribe;
pub mod lib_llm;

pub use ic_llm::ChatMessage;

#[derive(CandidType, Deserialize, Clone)]
pub struct UploadSession {
    pub id: String,
    pub filename: String,
    pub content_type: String,
    pub total_size: u64,
    pub total_chunks: u64,
    pub uploaded_chunks: Vec<Vec<u8>>,
    pub owner: Principal,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize)]
pub struct StartUploadRequest {
    pub filename: String,
    pub content_type: String,
    pub total_size: u64,
    pub total_chunks: u64,
}

#[derive(CandidType, Deserialize)]
pub struct UploadChunkRequest {
    pub session_id: String,
    pub chunk_index: u64,
    pub data: Vec<u8>,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct UploadedFile {
    pub id: String,
    pub filename: String,
    pub content_type: String,
    pub size: u64,
    pub data: Vec<u8>,
    pub owner: Principal,
    pub uploaded_at: u64,
}

type UploadSessions = HashMap<String, UploadSession>;
type UploadedFiles = HashMap<String, UploadedFile>;

thread_local! {
    static UPLOAD_SESSIONS: RefCell<UploadSessions> = RefCell::new(HashMap::new());
    static UPLOADED_FILES: RefCell<UploadedFiles> = RefCell::new(HashMap::new());
}

// Generate unique ID
fn generate_id() -> String {
    let time = api::time();
    let caller = api::caller();
    format!("{}-{}", time, caller.to_text())
}

#[update]
pub fn start_upload(request: StartUploadRequest) -> Result<String, String> {
    let caller = api::caller();

    // Validate file size (max 100MB)
    if request.total_size > 100 * 1024 * 1024 {
        return Err("File size exceeds maximum limit of 100MB".to_string());
    }

    // Validate content type
    if !request.content_type.starts_with("video/") && !request.content_type.starts_with("audio/") {
        return Err("Invalid content type. Only video and audio files are allowed".to_string());
    }

    let session_id = generate_id();
    let session = UploadSession {
        id: session_id.clone(),
        filename: request.filename,
        content_type: request.content_type,
        total_size: request.total_size,
        total_chunks: request.total_chunks,
        uploaded_chunks: Vec::new(),
        owner: caller,
        created_at: api::time(),
    };

    UPLOAD_SESSIONS.with(|sessions| {
        sessions.borrow_mut().insert(session_id.clone(), session);
    });

    Ok(session_id)
}

#[update]
pub fn upload_chunk(request: UploadChunkRequest) -> Result<String, String> {
    let caller = api::caller();

    UPLOAD_SESSIONS.with(|sessions| {
        let mut sessions = sessions.borrow_mut();

        match sessions.get_mut(&request.session_id) {
            Some(session) => {
                // Verify ownership
                if session.owner != caller {
                    return Err("Unauthorized: You don't own this upload session".to_string());
                }

                // Validate chunk index
                if request.chunk_index >= session.total_chunks {
                    return Err("Invalid chunk index".to_string());
                }

                // Ensure we have enough space for this chunk
                while session.uploaded_chunks.len() <= (request.chunk_index as usize) {
                    session.uploaded_chunks.push(Vec::new());
                }

                // Store the chunk
                session.uploaded_chunks[request.chunk_index as usize] = request.data;

                Ok("Chunk uploaded successfully".to_string())
            }
            None => Err("Upload session not found".to_string()),
        }
    })
}

#[update]
pub fn complete_upload(session_id: String) -> Result<String, String> {
    let caller = api::caller();

    UPLOAD_SESSIONS.with(|sessions| {
        let mut sessions = sessions.borrow_mut();

        match sessions.remove(&session_id) {
            Some(session) => {
                // Verify ownership
                if session.owner != caller {
                    return Err("Unauthorized: You don't own this upload session".to_string());
                }

                // Verify all chunks are uploaded
                if session.uploaded_chunks.len() != (session.total_chunks as usize) {
                    return Err("Not all chunks have been uploaded".to_string());
                }

                // Combine all chunks
                let mut file_data = Vec::new();
                for chunk in &session.uploaded_chunks {
                    if chunk.is_empty() {
                        return Err("Missing chunk data".to_string());
                    }
                    file_data.extend_from_slice(chunk);
                }

                // Verify file size
                if file_data.len() != (session.total_size as usize) {
                    return Err("File size mismatch".to_string());
                }

                let file_id = generate_id();
                let uploaded_file = UploadedFile {
                    id: file_id.clone(),
                    filename: session.filename,
                    content_type: session.content_type,
                    size: session.total_size,
                    data: file_data,
                    owner: caller,
                    uploaded_at: api::time(),
                };

                UPLOADED_FILES.with(|files| {
                    files.borrow_mut().insert(file_id.clone(), uploaded_file);
                });

                // Here you can add your processing logic
                // For example: start transcription, analysis, etc.
                process_uploaded_file(&file_id)?;

                Ok(file_id)
            }
            None => Err("Upload session not found".to_string()),
        }
    })
}

#[query]
pub fn get_upload_status(session_id: String) -> Result<(u64, u64), String> {
    let caller = api::caller();

    UPLOAD_SESSIONS.with(|sessions| {
        let sessions = sessions.borrow();

        match sessions.get(&session_id) {
            Some(session) => {
                if session.owner != caller {
                    return Err("Unauthorized".to_string());
                }

                let uploaded_chunks = session.uploaded_chunks
                    .iter()
                    .filter(|chunk| !chunk.is_empty())
                    .count() as u64;

                Ok((uploaded_chunks, session.total_chunks))
            }
            None => Err("Upload session not found".to_string()),
        }
    })
}

#[query]
pub fn get_file(file_id: String) -> Result<UploadedFile, String> {
    let caller = api::caller();

    UPLOADED_FILES.with(|files| {
        let files = files.borrow();

        match files.get(&file_id) {
            Some(file) => {
                if file.owner != caller {
                    return Err("Unauthorized".to_string());
                }
                Ok(file.clone())
            }
            None => Err("File not found".to_string()),
        }
    })
}

#[query]
pub fn list_files() -> Vec<(String, String, String, u64)> {
    let caller = api::caller();

    UPLOADED_FILES.with(|files| {
        files
            .borrow()
            .values()
            .filter(|file| file.owner == caller)
            .map(|file| (
                file.id.clone(),
                file.filename.clone(),
                file.content_type.clone(),
                file.size,
            ))
            .collect()
    })
}

#[update]
pub fn delete_file(file_id: String) -> Result<String, String> {
    let caller = api::caller();

    UPLOADED_FILES.with(|files| {
        let mut files = files.borrow_mut();

        match files.get(&file_id) {
            Some(file) => {
                if file.owner != caller {
                    return Err("Unauthorized".to_string());
                }
                files.remove(&file_id);
                Ok("File deleted successfully".to_string())
            }
            None => Err("File not found".to_string()),
        }
    })
}

// Function to process uploaded file (implement your business logic here)
fn process_uploaded_file(file_id: &str) -> Result<(), String> {
    // Here you can implement your file processing logic
    // For example:
    // - Start transcription process
    // - Generate thumbnail for video
    // - Extract metadata
    // - Send to external services

    ic_cdk::println!("Processing file: {}", file_id);

    // Example: You might want to call external services or start async processing
    // For now, we'll just log the action

    Ok(())
}

// Cleanup function to remove old upload sessions
#[update]
pub fn cleanup_old_sessions() -> String {
    let current_time = api::time();
    let max_age = 60 * 60 * 1_000_000_000; // 1 hour in nanoseconds

    UPLOAD_SESSIONS.with(|sessions| {
        let mut sessions = sessions.borrow_mut();
        let initial_count = sessions.len();

        sessions.retain(|_, session| { current_time - session.created_at < max_age });

        let removed_count = initial_count - sessions.len();
        format!("Cleaned up {} old upload sessions", removed_count)
    })
}

ic_cdk::export_candid!();
