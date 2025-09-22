use futures::FutureExt;
use ic_cdk::{ query, update };

use crate::{
    common::find_json_in_text,
    modules::{
        upload::{
            domain::entities::{
                FileArtifact,
                FileArtifactFilter,
                FileArtifactRequest,
                FileArtifactVisibility,
                JobStatus,
                LlmResponse,
                Summary,
                UserBookmarks,
                UserFileArtifact,
            },
            service::{
                call_ollama,
                fetch_file_artifacts,
                save_file_artifact,
                check_artifact_accessible,
            },
        },
    },
    FILE_ARTIFACTS,
    JOBS,
    SUMMARIES,
    TRANSCRIPTIONS,
    UPLOADED_FILES,
    USER_BOOKMARKS,
};

/* Summarization */

/// Start the summarization process
#[update]
pub async fn start_summarization(file_id: String) -> Result<String, String> {
    let file_id_clone = file_id.clone();

    ic_cdk::spawn(async move {
        // Wrap the whole process in catch_unwind so panic ≠ silent drop
        let result = std::panic
            ::AssertUnwindSafe(async {
                let get_transcription = TRANSCRIPTIONS.with(|map| map.borrow().get(&file_id_clone));

                if let Some(transcription) = get_transcription {
                    let prompt = format!(
                        "Please summarize the following text and also generate a short, clear, and descriptive title (max 10 words). 
                    The summary MUST be concise and no longer than 150 words.
                    Return ONLY valid JSON in this exact format — no explanations, no extra text:
                    {{
                        \"title\": \"...\",
                        \"summary\": \"...\",
                    }}

                    Text: {}",
                        transcription.text
                    );
                    ic_cdk::println!("Prompt: {}", prompt);

                    let created_at = ic_cdk::api::time();
                    ic_cdk::println!("Calling Ollama...");

                    let mut summarization_text: String = "Err: No response".to_string();
                    for attempt in 1..=3 {
                        ic_cdk::println!("Start Attempt {}", attempt);

                        match call_ollama(prompt.clone()).await {
                            Ok(res) => {
                                summarization_text = res;
                                break;
                            }
                            Err(e) => {
                                ic_cdk::println!("Ollama error on attempt {}: {}", attempt, e);
                                if attempt == 3 {
                                    summarization_text = format!("Err: {}", e);
                                }
                            }
                        }
                    }

                    // Extract summary + title
                    let (summary_text, title_text) = match find_json_in_text(&summarization_text) {
                        Some(json_str) =>
                            match serde_json::from_str::<LlmResponse>(&json_str) {
                                Ok(parsed) => (parsed.summary, parsed.title),
                                Err(_) => (summarization_text.clone(), "Untitled".to_string()),
                            }
                        None => (summarization_text.clone(), "Untitled".to_string()),
                    };

                    ic_cdk::println!("Summarization Text: {}", summarization_text);

                    let summary = Summary {
                        file_id: file_id_clone.clone(),
                        text: summary_text.clone(),
                        created_at,
                        deleted_at: None,
                    };

                    // ✅ Always insert something, even if it's an "Err: ..." string
                    SUMMARIES.with(|map|
                        map.borrow_mut().insert(file_id_clone.clone(), summary.clone())
                    );

                    let request = FileArtifactRequest {
                        file_id: file_id_clone.clone(),
                        title: Some(title_text),
                        transcription: Some(transcription),
                        summary: Some(summary),
                    };

                    save_file_artifact(request);
                } else {
                    ic_cdk::println!("No transcription found for {}", file_id_clone);
                }
            })
            .catch_unwind().await;

        if result.is_err() {
            // Panic happened — mark as Failed so frontend stops polling
            let summary = Summary {
                file_id: file_id_clone.clone(),
                text: "Err: summarization panicked".to_string(),
                created_at: ic_cdk::api::time(),
                deleted_at: None,
            };
            SUMMARIES.with(|map| map.borrow_mut().insert(file_id_clone.clone(), summary));
        }
    });

    Ok(file_id)
}

/// Query a summary result
#[query]
pub fn get_summary_result(file_id: String) -> JobStatus {
    SUMMARIES.with(|map| map.borrow().get(&file_id))
        .map(|s| {
            if s.text.starts_with("Err:") {
                JobStatus::Failed(s.text.clone())
            } else {
                JobStatus::Completed(s.text.clone())
            }
        })
        .unwrap_or(JobStatus::Pending)
}

/// Query a file artifact with bookmark info for the caller
#[query]
pub fn get_file_artifact(file_id: String) -> Option<UserFileArtifact> {
    let caller = ic_cdk::api::caller();

    FILE_ARTIFACTS.with(|map| {
        map.borrow()
            .get(&file_id)
            .filter(|artifact| check_artifact_accessible(&caller, artifact))
            .map(|artifact| {
                let is_bookmarked = USER_BOOKMARKS.with(|ub| {
                    ub.borrow()
                        .get(&caller)
                        .map(|entry| entry.file_ids.contains(&file_id))
                        .unwrap_or(false)
                });

                UserFileArtifact { artifact, is_bookmarked }
            })
    })
}

/// Update a file artifact
#[update]
pub fn edit_file_artifact(request: FileArtifactRequest) -> Result<FileArtifact, String> {
    let caller = ic_cdk::api::caller();

    FILE_ARTIFACTS.with(|map| {
        let mut store = map.borrow_mut();

        if let Some(mut artifact) = store.get(&request.file_id) {
            if artifact.owner != caller {
                return Err("Unauthorized: You are not the owner".to_string());
            }

            // Update only the provided fields
            if request.title.is_some() {
                artifact.title = request.title;
            }

            if request.transcription.is_some() {
                artifact.transcription = request.transcription;
            }

            if request.summary.is_some() {
                artifact.summary = request.summary;
            }

            // Save updated artifact
            store.insert(request.file_id.clone(), artifact.clone());
            Ok(artifact)
        } else {
            Err(format!("File artifact with id {} not found", request.file_id))
        }
    })
}

/// Delete a file artifact
#[update]
pub fn delete_file_artifact(file_id: String) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    // Fetch and check ownership
    let artifact = FILE_ARTIFACTS.with(|map| map.borrow().get(&file_id)).ok_or_else(||
        format!("Artifact {file_id} not found")
    )?;

    if artifact.owner != caller {
        return Err("Unauthorized: you are not the owner".to_string());
    }

    // Remove the File Artifact
    FILE_ARTIFACTS.with(|map| {
        map.borrow_mut().remove(&file_id);
    });

    // Remove related Transcription
    TRANSCRIPTIONS.with(|map| {
        map.borrow_mut().remove(&file_id);
    });

    // Remove related Summary
    SUMMARIES.with(|map| {
        map.borrow_mut().remove(&file_id);
    });

    // Remove uploaded file if you want to clean raw upload too
    UPLOADED_FILES.with(|map| {
        map.borrow_mut().remove(&file_id);
    });

    // (Optional) remove jobs linked to this file
    JOBS.with(|map| {
        map.borrow_mut().remove(&file_id);
    });

    Ok(())
}

/// List all file artifact for the current caller
#[query]
pub fn list_user_file_artifacts(filter: Option<FileArtifactFilter>) -> Vec<UserFileArtifact> {
    let caller = ic_cdk::api::caller();

    fetch_file_artifacts(|artifact| artifact.owner == caller, filter)
}

/// List all bookmarked file artifacts for the current caller
#[query]
pub fn list_saved_file_artifacts(filter: Option<FileArtifactFilter>) -> Vec<UserFileArtifact> {
    let caller = ic_cdk::api::caller();

    // Get caller’s bookmarked file_ids once
    let file_ids = USER_BOOKMARKS.with(|ub| {
        ub.borrow()
            .get(&caller)
            .map(|entry| entry.file_ids.clone())
            .unwrap_or_default()
    });

    // Use fetch_file_artifacts with a filter_fn that only allows bookmarked files
    fetch_file_artifacts(
        |artifact|
            file_ids.contains(&artifact.file_id) && check_artifact_accessible(&caller, artifact),
        filter
    )
}

/// Search all file artifacts
#[query]
pub fn search_file_artifacts(filter: Option<FileArtifactFilter>) -> Vec<UserFileArtifact> {
    let caller = ic_cdk::api::caller();

    fetch_file_artifacts(|artifact| check_artifact_accessible(&caller, artifact), filter)
}

/// Toggle visibility of a file artifact
#[update]
pub fn toggle_file_artifact_visibility(file_id: String) -> Result<String, String> {
    let caller = ic_cdk::api::caller();

    FILE_ARTIFACTS.with(|map| {
        let mut store = map.borrow_mut();

        if let Some(mut artifact) = store.get(&file_id) {
            if artifact.owner != caller {
                return Err("Unauthorized: You are not the owner".to_string());
            }

            artifact.visibility = match artifact.visibility {
                FileArtifactVisibility::Private => FileArtifactVisibility::Public,
                FileArtifactVisibility::Public => FileArtifactVisibility::Private,
            };

            let visibility = artifact.visibility.clone();

            store.insert(file_id.clone(), artifact);

            Ok(format!("File artifact visibility changed to {:?}", visibility))
        } else {
            Err(format!("File artifact with id {} not found", file_id))
        }
    })
}

/// Bookmark a file artifact
#[update]
pub fn toggle_file_artifact_bookmark(file_id: String) -> Result<String, String> {
    let caller = ic_cdk::api::caller();

    FILE_ARTIFACTS.with(|map| {
        let map = map.borrow();

        match map.get(&file_id) {
            Some(artifact) => {
                if !check_artifact_accessible(&caller, &artifact) {
                    return Err("You cannot bookmark this private artifact".to_string());
                }

                USER_BOOKMARKS.with(|ub| {
                    let mut bookmarks = ub.borrow_mut();

                    // Get or create caller’s bookmark entry
                    let mut entry = bookmarks.get(&caller).unwrap_or(UserBookmarks {
                        user: caller,
                        file_ids: vec![],
                    });

                    if entry.file_ids.contains(&file_id) {
                        // Remove if already bookmarked
                        entry.file_ids.retain(|id| id != &file_id);
                        bookmarks.insert(caller, entry);
                        Ok("Removed file artifact from saved list".to_string())
                    } else {
                        // Add if not already bookmarked
                        entry.file_ids.push(file_id.clone());
                        bookmarks.insert(caller, entry);
                        Ok("Added file artifact to saved list".to_string())
                    }
                })
            }
            None => Err(format!("File artifact with id {} not found", file_id)),
        }
    })
}
