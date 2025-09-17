use std::panic::AssertUnwindSafe;

use futures::FutureExt;
use ic_llm::{ ChatMessage, Model };

pub async fn call_ollama(prompt_text: String) -> Result<String, String> {
    let truncated_text = &prompt_text[..std::cmp::min(prompt_text.len(), 5000)];

    let call = ic_llm
        ::chat(Model::Llama3_1_8B)
        .with_messages(
            vec![
                ChatMessage::System {
                    content: "You are a summarization assistant".to_string(),
                },
                ChatMessage::User {
                    content: truncated_text.to_string(),
                }
            ]
        )
        .send();

    // Catch panics instead of crashing the whole canister
    match AssertUnwindSafe(call).catch_unwind().await {
        Ok(response) => {
            match response.message.content {
                Some(text) if !text.is_empty() => Ok(text),
                _ => Err("No content returned from ic-llm".to_string()),
            }
        }
        Err(_) => Err("ic-llm panicked (timeout or fatal error)".to_string()),
    }
}
