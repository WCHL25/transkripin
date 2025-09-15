use ic_llm::{ ChatMessage, Model };

pub async fn call_ollama(prompt_text: String) -> Result<String, String> {
    let truncated_text = &prompt_text[..std::cmp::min(prompt_text.len(), 5000)];
    let response = ic_llm
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
        .send().await;

    match response.message.content {
        Some(text) if !text.is_empty() => Ok(text),
        _ => Err("No content returned from ic-llm".to_string()),
    }
}
