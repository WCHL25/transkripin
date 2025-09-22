use ic_cdk::{ query, update };

use crate::{
    common::*,
    modules::{
        upload::{
            service::check_artifact_visibility,
            domain::entities::{
                FileChunk,
                DownloadChunkRequest,
                DownloadChunkResponse,
                StartUploadRequest,
                UploadChunkRequest,
                UploadSession,
                UploadedFile,
            },
        },
    },
    FILE_CHUNKS,
    UPLOADED_FILES,
    UPLOAD_SESSIONS,
};

/* UPLOAD HANDLERS */
#[update]
pub fn start_upload(request: StartUploadRequest) -> Result<String, String> {
    let owner = ic_cdk::api::caller();

    // Validate file size (max 100MB)
    if request.total_size > 100 * 1024 * 1024 {
        return Err("File size exceeds maximum limit of 100MB".to_string());
    }

    // Validate content type
    if !request.content_type.starts_with("video/") && !request.content_type.starts_with("audio/") {
        return Err("Invalid content type. Only video and audio files are allowed".to_string());
    }

    let session_id = generate_id();
    let created_at = ic_cdk::api::time();
    let session = UploadSession {
        id: session_id.clone(),
        filename: request.filename,
        content_type: request.content_type,
        total_size: request.total_size,
        total_chunks: request.total_chunks,
        uploaded_chunks: Vec::with_capacity(request.total_chunks as usize),
        owner: owner,
        created_at: created_at,
        deleted_at: None,
    };

    UPLOAD_SESSIONS.with(|sessions| sessions.borrow_mut().insert(session_id.clone(), session));
    Ok(session_id)
}

#[update]
pub fn upload_chunk(request: UploadChunkRequest) -> Result<String, String> {
    let caller = ic_cdk::api::caller();

    UPLOAD_SESSIONS.with(|sessions| {
        let sessions = sessions.borrow_mut();
        if let Some(mut session) = sessions.get(&request.session_id) {
            if session.owner != caller {
                return Err("Unauthorized: You don't own this upload session".to_string());
            }

            if request.chunk_index >= session.total_chunks {
                return Err("Invalid chunk index".to_string());
            }

            // Store the chunk under session ID
            FILE_CHUNKS.with(|chunks| {
                let key = FileChunk {
                    id: session.id.clone(),
                    chunk_index: request.chunk_index,
                };
                chunks.borrow_mut().insert(key, request.data);
            });

            // Track uploaded chunks
            let chunk_bytes = request.chunk_index.to_le_bytes().to_vec();
            if !session.uploaded_chunks.contains(&chunk_bytes) {
                session.uploaded_chunks.push(chunk_bytes);
            }

            Ok("Chunk uploaded successfully".to_string())
        } else {
            Err("Upload session not found".to_string())
        }
    })
}

#[update]
pub async fn complete_upload(session_id: String) -> Result<String, String> {
    let caller = ic_cdk::api::caller();

    let uploaded_file = UPLOAD_SESSIONS.with(|sessions| {
        let mut sessions = sessions.borrow_mut();
        match sessions.remove(&session_id) {
            Some(session) => {
                if session.owner != caller {
                    return Err("Unauthorized: You don't own this upload session".to_string());
                }

                Ok(UploadedFile {
                    id: session.id.clone(),
                    filename: session.filename,
                    content_type: session.content_type,
                    size: session.total_size,
                    total_chunks: session.total_chunks,
                    created_at: session.created_at,
                    owner: caller,
                    deleted_at: None,
                })
            }
            None => Err("Upload session not found".to_string()),
        }
    })?;

    let file_id = uploaded_file.id.clone();
    UPLOADED_FILES.with(|files| files.borrow_mut().insert(file_id.clone(), uploaded_file));

    Ok(file_id)
}

/* Queries for uploads */
#[query]
pub fn get_upload_status(session_id: String) -> Result<(u64, u64), String> {
    let caller = ic_cdk::api::caller();

    UPLOAD_SESSIONS.with(|sessions| {
        let sessions = sessions.borrow();
        match sessions.get(&session_id) {
            Some(session) => {
                if session.owner != caller {
                    return Err(
                        "Unauthorized: You don't have permission for this action".to_string()
                    );
                }
                let uploaded_chunks = session.uploaded_chunks
                    .iter()
                    .filter(|c| !c.is_empty())
                    .count() as u64;

                Ok((uploaded_chunks, session.total_chunks))
            }
            None => Err("Upload session not found".to_string()),
        }
    })
}

#[query]
pub fn get_file_chunk(request: DownloadChunkRequest) -> Result<DownloadChunkResponse, String> {
    let caller = ic_cdk::api::caller();

    // Visibility check
    check_artifact_visibility(&request.file_id, caller)?;

    // Calculate which chunk to fetch
    let chunk_index = request.start / 1_048_576; // 1MB chunks
    let offset_in_chunk = (request.start % 1_048_576) as usize;
    let length = std::cmp::min(request.length as usize, 1_048_576);

    let chunk_data = FILE_CHUNKS.with(|chunks| {
        let key = FileChunk {
            id: request.file_id.clone(),
            chunk_index: chunk_index,
        };

        chunks
            .borrow()
            .get(&key)
            .ok_or("Chunk not found".to_string())
            .map(|c| {
                let end = std::cmp::min(offset_in_chunk + length, c.len());
                c[offset_in_chunk..end].to_vec()
            })
    })?;

    let total_size = UPLOADED_FILES.with(|files| {
        files
            .borrow()
            .get(&request.file_id)
            .map(|f| f.size)
            .unwrap_or(0)
    });

    Ok(DownloadChunkResponse {
        data: chunk_data,
        total_size,
    })
}

#[update]
pub fn delete_file(file_id: String) -> Result<String, String> {
    let caller = ic_cdk::api::caller();

    UPLOADED_FILES.with(|files| {
        let mut files = files.borrow_mut();
        match files.get(&file_id) {
            Some(f) => if f.owner != caller {
                Err("Unauthorized: You don't have permission for this action".to_string())
            } else {
                files.remove(&file_id);
                Ok("File deleted".to_string())
            }
            None => Err("File not found".to_string()),
        }
    })
}
