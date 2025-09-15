use futures::FutureExt;
use ic_cdk::{ query, update };

use crate::{
    common::find_json_in_text,
    modules::upload::{
        domain::entities::{ FileArtifact, LlmResponse, Summary },
        service::{ call_ollama, save_file_artifact },
    },
    FILE_ARTIFACTS,
    SUMMARIES,
    TRANSCRIPTIONS,
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

            save_file_artifact(
                &file_id_clone,
                Some(title_text),
                Some(transcription),
                Some(summary)
            );
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

/// List all file artifact for the current caller
#[query]
pub fn list_user_file_artifacts() -> Vec<FileArtifact> {
    let caller = ic_cdk::api::caller();
    FILE_ARTIFACTS.with(|results| {
        results
            .borrow()
            .values()
            .filter(|r| r.owner == caller)
            .collect()
    })
}
