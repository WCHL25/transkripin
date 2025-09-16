use futures::FutureExt;
use ic_cdk::{ query, update };

use crate::{
    common::find_json_in_text,
    modules::{
        upload::{
            domain::entities::{
                Bookmark,
                FileArtifact,
                FileArtifactRequest,
                FileArtifactFilter,
                FileArtifactVisibility,
                LlmResponse,
                Summary,
            },
            service::{ call_ollama, save_file_artifact, filter_file_artifacts },
        },
    },
    BOOKMARKS,
    FILE_ARTIFACTS,
    JOBS,
    SUMMARIES,
    TRANSCRIPTIONS,
    UPLOADED_FILES,
};

/* Summarization */
#[update]
pub async fn start_summarization(file_id: String) -> Result<String, String> {
    let file_id_clone = file_id.clone();

    ic_cdk::spawn(async move {
        let get_transcription = TRANSCRIPTIONS.with(|map| map.borrow().get(&file_id_clone));

        if let Some(transcription) = get_transcription {
            let prompt = format!(
                "Please summarize the following text and also generate a short, clear, and descriptive title (max 10 words). Return ONLY valid JSON in this exact format — no explanations, no extra text:
                {{
                    \"title\": \"...\"
                    \"summary\": \"...\",
                }}

                Text: {}",
                transcription.text
            );
            ic_cdk::println!("Prompt: {}", prompt);

            let created_at = ic_cdk::api::time();
            ic_cdk::println!("Calling Ollama...");

            // Call Ollama safely and catch any panics
            let summarization_text_result = std::panic
                ::AssertUnwindSafe(call_ollama(prompt))
                .catch_unwind().await;

            // Determine result and success flag
            let summarization_text = match summarization_text_result {
                Ok(text) => text.unwrap_or_else(|e| format!("Err: {}", e)),
                Err(_) => "Err:  LLM panicked".to_string(),
            };

            // Extract summary and title, use function to find json if llm returns extra text
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
                created_at: created_at,
                deleted_at: None,
            };

            SUMMARIES.with(|map| map.borrow_mut().insert(file_id_clone.clone(), summary.clone()));

            let request = FileArtifactRequest {
                file_id: file_id_clone,
                title: Some(title_text),
                transcription: Some(transcription),
                summary: Some(summary),
            };

            save_file_artifact(request);
        } else {
            ic_cdk::println!("No transcription found for {}", file_id_clone);
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

/// Query a file artifact
#[query]
pub fn get_file_artifact(file_id: String) -> Option<FileArtifact> {
    FILE_ARTIFACTS.with(|map| map.borrow().get(&file_id))
}

// Update a file artifact
#[update]
pub fn edit_file_artifact(request: FileArtifactRequest) -> Result<FileArtifact, String> {
    FILE_ARTIFACTS.with(|map| {
        let mut store = map.borrow_mut();

        if let Some(mut artifact) = store.get(&request.file_id) {
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
    let artifact_deleted = FILE_ARTIFACTS.with(|map| map.borrow_mut().remove(&file_id));
    if artifact_deleted.is_none() {
        return Err(format!("File artifact with id {} not found", file_id));
    }

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

#[update]
pub fn toggle_file_artifact_visibility(file_id: String) -> Result<FileArtifact, String> {
    FILE_ARTIFACTS.with(|map| {
        let mut store = map.borrow_mut();

        if let Some(mut artifact) = store.get(&file_id) {
            let visibility = match artifact.visibility {
                FileArtifactVisibility::Private => FileArtifactVisibility::Public,
                FileArtifactVisibility::Public => FileArtifactVisibility::Private,
            };

            artifact.visibility = visibility;

            store.insert(file_id.clone(), artifact.clone());

            Ok(artifact)
        } else {
            Err(format!("File artifact with id {} not found", file_id))
        }
    })
}

/// List all file artifact for the current caller
#[query]
pub fn list_user_file_artifacts(filter: Option<FileArtifactFilter>) -> Vec<FileArtifact> {
    let caller = ic_cdk::api::caller();

    // Get all file artifacts for the current caller
    let artifacts: Vec<FileArtifact> = FILE_ARTIFACTS.with(|results| {
        results
            .borrow()
            .values()
            .filter(|r| r.owner == caller)
            .collect()
    });

    filter_file_artifacts(artifacts, filter)
}

/// List all bookmarked file artifacts for the current caller
#[query]
pub fn list_saved_file_artifacts(filter: Option<FileArtifactFilter>) -> Vec<FileArtifact> {
    let caller = ic_cdk::api::caller();

    let artifacts: Vec<FileArtifact> = BOOKMARKS.with(|bookmarks| {
        let bookmarks = bookmarks.borrow();
        let file_ids: Vec<String> = bookmarks
            .keys()
            .filter(|key| key.user == caller)
            .map(|key| key.file_id.clone())
            .collect();

        FILE_ARTIFACTS.with(|artifacts| {
            let artifacts = artifacts.borrow();
            file_ids
                .into_iter()
                .filter_map(|fid| artifacts.get(&fid))
                .collect()
        })
    });

    filter_file_artifacts(artifacts, filter)
}

/// Bookmark a file artifact
#[update]
pub fn add_bookmark(file_id: String) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    // Ensure file exists before bookmarking
    let exists = FILE_ARTIFACTS.with(|map| map.borrow().contains_key(&file_id));
    if !exists {
        return Err(format!("File artifact with id {} not found", file_id));
    }

    BOOKMARKS.with(|map| {
        let mut store = map.borrow_mut();
        let key = Bookmark { user: caller, file_id: file_id.clone() };

        if store.contains_key(&key) {
            return Err("File already bookmarked".to_string());
        }

        store.insert(key, ());
        Ok(())
    })
}

/// Remove a bookmark file artifact
#[update]
pub fn remove_bookmark(file_id: String) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    BOOKMARKS.with(|map| {
        let mut store = map.borrow_mut();
        let key = Bookmark {
            user: caller,
            file_id: file_id.clone(),
        };

        if store.remove(&key).is_some() {
            Ok(())
        } else {
            Err(format!("File artifact {} is not bookmarked", file_id))
        }
    })
}
