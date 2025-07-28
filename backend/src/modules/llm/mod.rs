pub use ic_llm::Model;

pub async fn summarize_transcription(transcription: String) -> String {
    let prompt_text = format!("Summarize the following transcription:\n\n{}", transcription);
    ic_llm::prompt(Model::Llama3_1_8B, prompt_text).await
}
