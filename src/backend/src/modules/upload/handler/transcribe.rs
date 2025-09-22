use ic_cdk::{ query, update };

use crate::{
    modules::upload::{
        domain::entities::{ JobStatus, Transcription },
        service::{ call_transcription, fetch_transcription_api },
    },
    JOBS,
    TRANSCRIPTIONS,
    UPLOADED_FILES,
};

/* Transcription */
#[update]
pub async fn start_transcription(file_id: String) -> Result<String, String> {
    UPLOADED_FILES.with(|files| files.borrow().get(&file_id).ok_or("File not found".to_string()))?;

    let job_id = call_transcription(file_id.clone()).await?;

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
    fetch_transcription_api(&job_id, "status", |status_str| {
        serde_json::from_str(&status_str).map_err(|e| format!("Invalid JSON: {:?}", e))
    }).await
}

#[update]
pub async fn get_transcription_result(job_id: String) -> Result<String, String> {
    fetch_transcription_api(&job_id, "result", |result_str| {
        // Insert into TRANSCRIPTIONS map if job_id exists
        if let Some(file_id) = JOBS.with(|jobs| jobs.borrow().get(&job_id)) {
            TRANSCRIPTIONS.with(|map| {
                let file_id_clone = file_id.clone();
                let created_at = ic_cdk::api::time();

                let (text, language, segments) = match
                    serde_json::from_str::<serde_json::Value>(&result_str)
                {
                    Ok(parsed) => {
                        let text = parsed
                            .get("text")
                            .and_then(|v| v.as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| result_str.clone());

                        let language = parsed
                            .get("language")
                            .and_then(|v| v.as_str().map(|s| s.to_string()))
                            .unwrap_or_else(|| "unknown".to_string());

                        let segments = parsed
                            .get("segments")
                            .and_then(|v| serde_json::from_value(v.clone()).ok())
                            .unwrap_or_else(|| vec![]);
                        (text, language, segments)
                    }
                    Err(_) => (result_str.clone(), "unknown".to_string(), vec![]),
                };

                map.borrow_mut().insert(file_id_clone, Transcription {
                    job_id: job_id.clone(),
                    file_id: file_id.clone(),
                    text: text,
                    language: language,
                    segments: segments,
                    created_at: created_at,
                    deleted_at: None,
                });
            });
        } else {
            return Err("No file ID found for this job ID".to_string());
        }

        Ok(result_str)
    }).await
}
