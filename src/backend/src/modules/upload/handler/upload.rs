use ic_cdk::{ query, update };

use crate::{
    common::*,
    modules::{
        upload::{
            service::check_artifact_visibility,
            domain::entities::{
                DownloadChunkRequest,
                DownloadChunkResponse,
                StartUploadRequest,
                UploadChunkRequest,
                UploadSession,
                UploadedFile,
            },
        },
    },
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
        let mut sessions = sessions.borrow_mut();

        // Remove the session temporarily
        if let Some(mut session) = sessions.remove(&request.session_id) {
            if session.owner != caller {
                // Put it back before returning
                sessions.insert(request.session_id.clone(), session);
                return Err("Unauthorized: You don't own this upload session".to_string());
            }
            if request.chunk_index >= session.total_chunks {
                sessions.insert(request.session_id.clone(), session);
                return Err("Invalid chunk index".to_string());
            }

            let idx = request.chunk_index as usize;
            if session.uploaded_chunks.len() <= idx {
                session.uploaded_chunks.resize(session.total_chunks as usize, Vec::new());
            }
            if !session.uploaded_chunks[idx].is_empty() {
                sessions.insert(request.session_id.clone(), session);
                return Err("Chunk already uploaded".to_string());
            }

            session.uploaded_chunks[idx] = request.data;

            // Re-insert the modified session
            sessions.insert(request.session_id.clone(), session);

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
                let created_at = ic_cdk::api::time();

                Ok(UploadedFile {
                    id: file_id,
                    filename: session.filename,
                    content_type: session.content_type,
                    size: session.total_size,
                    data: file_data,
                    owner: caller,
                    created_at: created_at,
                    deleted_at: None,
                })
            }
            None => Err("Upload session not found".to_string()),
        }
    })?;

    let file_id = uploaded_file.id.clone();
    ic_cdk::println!("File Id:{}", file_id);

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
pub fn get_file(file_id: String) -> Result<UploadedFile, String> {
    let caller = ic_cdk::api::caller();

    // Visibility check
    check_artifact_visibility(&file_id, caller)?;

    UPLOADED_FILES.with(|files| {
        let files = files.borrow();
        match files.get(&file_id) {
            Some(file) => Ok(file),
            None => Err("File not found".to_string()),
        }
    })
}

#[query]
pub fn get_file_chunk(request: DownloadChunkRequest) -> Result<DownloadChunkResponse, String> {
    let caller = ic_cdk::api::caller();

    // Visibility check
    check_artifact_visibility(&request.file_id, caller)?;

    UPLOADED_FILES.with(|files| {
        let files = files.borrow();
        let file = files.get(&request.file_id).ok_or_else(|| "File not found".to_string())?;

        let total_size = file.size;
        let end = std::cmp::min(request.start + request.length, total_size);

        if request.start >= end {
            return Err("Invalid start position".to_string());
        }

        let data = file.data[request.start as usize..end as usize].to_vec();

        Ok(DownloadChunkResponse { data, total_size })
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
