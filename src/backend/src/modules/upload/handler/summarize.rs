use ic_cdk::{ query, update };

use crate::{
    modules::upload::{
        domain::entities::{ Summary, FinalResult },
        service::{ call_ollama, save_final_result },
    },
    FINAL_RESULTS,
    SUMMARIES,
    TRANSCRIPTIONS,
};

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
                let created_at = ic_cdk::api::time();

                match summarization {
                    Ok(text) => {
                        let summary = Summary {
                            file_id: file_id_clone.clone(),
                            text: text,
                            created_at: created_at,
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
