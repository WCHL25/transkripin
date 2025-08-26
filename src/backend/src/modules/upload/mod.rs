use ic_cdk::{
    api::management_canister::http_request::{
        http_request,
        CanisterHttpRequestArgument,
        HttpMethod,
        HttpResponse,
    },
    query,
    update,
};

pub mod domain;

pub use domain::*;

use crate::{
    common::*,
    FINAL_RESULTS,
    JOBS,
    SUMMARIES,
    TRANSCRIPTIONS,
    UPLOADED_FILES,
    UPLOAD_SESSIONS,
};

/* UPLOAD HANDLERS */
#[update]
pub fn start_upload(request: StartUploadRequest) -> Result<String, String> {
    let caller = ic_cdk::api::caller();

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
        uploaded_chunks: Vec::with_capacity(request.total_chunks as usize),
        owner: caller,
        created_at: ic_cdk::api::time(),
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
                Ok(UploadedFile {
                    id: file_id,
                    filename: session.filename,
                    content_type: session.content_type,
                    size: session.total_size,
                    data: file_data,
                    owner: caller,
                    uploaded_at: ic_cdk::api::time(),
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
                    return Err("Unauthorized".to_string());
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
    UPLOADED_FILES.with(|files| {
        let files = files.borrow();
        match files.get(&file_id) {
            Some(file) => if file.owner != caller {
                Err("Unauthorized".to_string())
            } else {
                Ok(file.clone())
            }
            None => Err("File not found".to_string()),
        }
    })
}

#[query]
pub fn list_files() -> Vec<(String, String, String, u64)> {
    let caller = ic_cdk::api::caller();
    UPLOADED_FILES.with(|files| {
        files
            .borrow()
            .values()
            .filter(|f| f.owner == caller)
            .map(|f| (f.id.clone(), f.filename.clone(), f.content_type.clone(), f.size))
            .collect()
    })
}

#[update]
pub fn delete_file(file_id: String) -> Result<String, String> {
    let caller = ic_cdk::api::caller();
    UPLOADED_FILES.with(|files| {
        let mut files = files.borrow_mut();
        match files.get(&file_id) {
            Some(f) => if f.owner != caller {
                Err("Unauthorized".to_string())
            } else {
                files.remove(&file_id);
                Ok("File deleted".to_string())
            }
            None => Err("File not found".to_string()),
        }
    })
}

/* Transcription */
#[update]
pub async fn start_transcription(file_id: String) -> Result<String, String> {
    let file = UPLOADED_FILES.with(|files|
        files.borrow().get(&file_id).ok_or("File not found".to_string())
    )?;
    let job_id = call_transcription(file).await?;
    JOBS.with(|jobs| jobs.borrow_mut().insert(job_id.clone(), file_id));
    Ok(job_id)
}

#[query]
pub fn get_transcription(file_id: String) -> Result<String, String> {
    TRANSCRIPTIONS.with(|map| {
        map.borrow()
            .get(&file_id)
            .map(|t| t.text.clone())
            .ok_or("No transcription found".to_string())
    })
}

#[update]
pub async fn get_transcription_status(job_id: String) -> Result<JobStatus, String> {
    let response_size = 2_000_000u64;
    let cycles = 400_000_000 + (0 + response_size) * 600_000;

    let status_req = CanisterHttpRequestArgument {
        url: format!("{}/status/{}", TRANSCRIPTION_URL, job_id),
        method: HttpMethod::GET,
        headers: vec![],
        body: None,
        max_response_bytes: Some(response_size),
        transform: None,
    };

    let (status_res,): (HttpResponse,) = http_request(status_req, cycles.into()).await.map_err(|e| {
        format!("Status request failed: {:?}", e)
    })?;

    let status_str = String::from_utf8(status_res.body).map_err(|_|
        "Invalid UTF-8 in status response".to_string()
    )?;

    // Deserialize JSON directly into JobStatus
    let parsed: JobStatus = serde_json
        ::from_str(&status_str)
        .map_err(|e| format!("Invalid JSON: {:?}", e))?;

    Ok(parsed)
}

#[update]
pub async fn get_transcription_result(job_id: String) -> Result<String, String> {
    let response_size = 2_000_000u64;
    let cycles = 400_000_000 + (0 + response_size) * 600_000;

    let result_req = CanisterHttpRequestArgument {
        url: format!("{}/result/{}", TRANSCRIPTION_URL, job_id),
        method: HttpMethod::GET,
        headers: vec![],
        body: None,
        max_response_bytes: Some(response_size),
        transform: None,
    };

    let (result_res,): (HttpResponse,) = http_request(result_req, cycles.into()).await.map_err(|e| {
        format!("Result request failed: {:?}", e)
    })?;

    let result_str = String::from_utf8(result_res.body).map_err(|_|
        "Invalid UTF-8 in result response".to_string()
    )?;

    // Find matching file_id
    if let Some(file_id) = JOBS.with(|jobs| jobs.borrow().get(&job_id)) {
        TRANSCRIPTIONS.with(|map| {
            let file_id_clone = file_id.clone();

            map.borrow_mut().insert(file_id_clone, Transcription {
                job_id: job_id.clone(),
                file_id: file_id.clone(),
                text: result_str.clone(),
                created_at: ic_cdk::api::time(),
            });
        });
    } else {
        return Err("No file ID found for this job ID".to_string());
    }

    Ok(result_str)
}

/* Summarization */
#[update]
pub async fn start_summarization(file_id: String) -> Result<String, String> {
    let file_id_clone = file_id.clone();

    ic_cdk::spawn(async move {
        match TRANSCRIPTIONS.with(|map| map.borrow().get(&file_id_clone)) {
            Some(transcription) => {
                let prompt = format!("Summarize the following text:\n\n{}", transcription.text);

                ic_cdk::println!("Prompt:{}", prompt);

                let summarization = call_ollama(prompt).await;

                match summarization {
                    Ok(text) => {
                        let summary = Summary {
                            file_id: file_id_clone.clone(),
                            text: text,
                            created_at: ic_cdk::api::time(),
                        };

                        SUMMARIES.with(|map| {
                            map.borrow_mut().insert(file_id_clone.clone(), summary.clone());
                        });

                        save_final_result(&file_id_clone, Some(transcription), Some(summary));
                    }
                    Err(e) => ic_cdk::println!("Summary failed: {}", e),
                }
            }
            None => ic_cdk::println!("No transcription found for {}", file_id_clone),
        }
    });

    Ok(file_id)
}

#[query]
pub fn get_summary_result(file_id: String) -> Result<String, String> {
    SUMMARIES.with(|map| map.borrow().get(&file_id))
        .map(|s| s.text.clone())
        .ok_or_else(|| "Summary not ready".to_string())
}

fn save_final_result(
    file_id: &str,
    transcription: Option<Transcription>,
    summary: Option<Summary>
) {
    let file = &file_id.to_string();
    let maybe_file = UPLOADED_FILES.with(|files| files.borrow().get(file));
    if let Some(f) = maybe_file {
        let final_result = FinalResult {
            file_id: f.id.clone(),
            filename: f.filename.clone(),
            content_type: f.content_type.clone(),
            size: f.size,
            owner: f.owner.clone(),
            uploaded_at: f.uploaded_at,
            transcription: transcription,
            summary: summary,
        };

        FINAL_RESULTS.with(|map| {
            map.borrow_mut().insert(file_id.to_string(), final_result);
        });
    }
}

/// Query a final result
#[query]
pub fn get_final_result(file_id: String) -> Option<FinalResult> {
    FINAL_RESULTS.with(|map| map.borrow().get(&file_id))
}

/// List all final results for the current caller
#[query]
pub fn list_user_final_results() -> Vec<FinalResult> {
    let caller = ic_cdk::api::caller();
    FINAL_RESULTS.with(|results| {
        results
            .borrow()
            .values()
            .filter(|r| r.owner == caller)
            .collect()
    })
}
