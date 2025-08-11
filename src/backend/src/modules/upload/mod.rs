use candid::{ CandidType, Deserialize, Principal };
use std::{ collections::HashMap, cell::RefCell };
use ic_cdk::{
    api::{
        self,
        management_canister::http_request::{
            http_request,
            CanisterHttpRequestArgument,
            HttpHeader,
            HttpMethod,
            HttpResponse,
        },
    },
    update,
    query,
};

use crate::modules::llm::summarize_transcription;

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
pub async fn complete_upload(session_id: String) -> Result<String, String> {
    let caller = api::caller();

    // Extract the session and build UploadedFile
    let uploaded_file = UPLOAD_SESSIONS.with(|sessions| {
        let mut sessions = sessions.borrow_mut();

        match sessions.remove(&session_id) {
            Some(session) => {
                if session.owner != caller {
                    return Err("Unauthorized: You don't own this upload session".to_string());
                }

                if session.uploaded_chunks.len() != (session.total_chunks as usize) {
                    return Err("Not all chunks have been uploaded".to_string());
                }

                let mut file_data = Vec::new();
                for chunk in &session.uploaded_chunks {
                    if chunk.is_empty() {
                        return Err("Missing chunk data".to_string());
                    }
                    file_data.extend_from_slice(chunk);
                }

                if file_data.len() != (session.total_size as usize) {
                    return Err("File size mismatch".to_string());
                }

                let file_id = generate_id();
                Ok(UploadedFile {
                    id: file_id,
                    filename: session.filename,
                    content_type: session.content_type,
                    size: session.total_size,
                    data: file_data,
                    owner: caller,
                    uploaded_at: api::time(),
                })
            }
            None => Err("Upload session not found".to_string()),
        }
    })?;

    let file_id = uploaded_file.id.clone();

    // Store the file
    UPLOADED_FILES.with(|files| {
        files.borrow_mut().insert(file_id.clone(), uploaded_file);
    });

    // Get transcription (dummy text or actual decoding from file)
    let transcription = process_uploaded_file(&file_id).await.map_err(|e|
        format!("Transcription failed: {}", e)
    )?;

    // Summarize transcription using ic_llm
    let summary = summarize_transcription(transcription).await;
    ic_cdk::println!("Summary: {}", summary);

    Ok(summary)
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
async fn process_uploaded_file(file_id: &str) -> Result<String, String> {
    let file = UPLOADED_FILES.with(|files| {
        files
            .borrow()
            .get(file_id)
            .cloned()
            .ok_or_else(|| "File not found".to_string())
    })?;

    // Directly call the transcription service and return result
    call_transcription_service(file).await
}

async fn call_transcription_service(file: UploadedFile) -> Result<String, String> {
    let base_url = "http://localhost:3000/transcribe";
    let boundary = "----ic_boundary";
    let chunk_size = 1_900_000; // ~1.9 MB
    let session_id = file.id.clone();

    let mut offset = 0;
    let mut chunk_index = 0;

    while offset < file.data.len() {
        let end = usize::min(offset + chunk_size, file.data.len());
        let chunk = &file.data[offset..end];

        // Build multipart body for chunk
        let mut body = Vec::new();

        // Session ID
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Disposition: form-data; name=\"session_id\"\r\n\r\n");
        body.extend_from_slice(session_id.as_bytes());
        body.extend_from_slice(b"\r\n");

        // Chunk index
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Disposition: form-data; name=\"chunk_index\"\r\n\r\n");
        body.extend_from_slice(chunk_index.to_string().as_bytes());
        body.extend_from_slice(b"\r\n");

        // Chunk data
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(
            format!(
                "Content-Disposition: form-data; name=\"file\"; filename=\"{}\"\r\n",
                file.filename
            ).as_bytes()
        );
        body.extend_from_slice(format!("Content-Type: {}\r\n\r\n", file.content_type).as_bytes());
        body.extend_from_slice(chunk);
        body.extend_from_slice(b"\r\n");
        body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

        // Calculate cycles
        let request_size = body.len() as u64;
        let response_size = 2_000_000u64;
        let cycles = 400_000_000 + (request_size + response_size) * 600_000;
        ic_cdk::println!(
            "Estimated cycles for HTTP request: {} (request_size: {} bytes)",
            cycles,
            request_size
        );

        // Construct request
        let request = CanisterHttpRequestArgument {
            url: format!("{}/upload_chunk", base_url),
            method: HttpMethod::POST,
            headers: vec![HttpHeader {
                name: "Content-Type".to_string(),
                value: format!("multipart/form-data; boundary={}", boundary),
            }],
            body: Some(body),
            max_response_bytes: Some(response_size),
            transform: None,
        };

        http_request(request, cycles.into()).await.map_err(|e|
            format!("Chunk {} upload failed: {:?}", chunk_index, e)
        )?;

        offset = end;
        chunk_index += 1;
    }

    // Tell server we're done uploading
    let finalize_body = serde_json
        ::to_vec(&serde_json::json!({
        "session_id": session_id
    }))
        .unwrap();

    let request_size = finalize_body.len() as u64;
    let response_size = 2_000_000u64;
    let cycles = 400_000_000 + (request_size + response_size) * 600_000;

    let finalize_request = CanisterHttpRequestArgument {
        url: format!("{}/finalize_upload", base_url),
        method: HttpMethod::POST,
        headers: vec![HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        }],
        body: Some(finalize_body),
        max_response_bytes: Some(2_000_000u64),
        transform: None,
    };

    let (response,): (HttpResponse,) = http_request(finalize_request, cycles.into()).await.map_err(
        |e| format!("Finalize request failed: {:?}", e)
    )?;

    let result = String::from_utf8(response.body).map_err(|_|
        "Invalid UTF-8 in response".to_string()
    )?;

    ic_cdk::println!("Transcription result: {}", result);

    Ok(result)
}
