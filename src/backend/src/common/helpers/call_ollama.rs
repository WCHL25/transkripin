use ic_cdk::api::{
    management_canister::http_request::{
        http_request,
        CanisterHttpRequestArgument,
        HttpHeader,
        HttpMethod,
    },
};
use crate::common::constants::uri::OLLAMA_URL;

pub async fn call_ollama(prompt: String) -> Result<String, String> {
    let request_body =
        serde_json::json!({
        "model": "llama3.1:8b",
        "prompt": prompt,
        "stream": false
    });

    let request_body_bytes = serde_json
        ::to_vec(&request_body)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;

    let request_size = request_body_bytes.len() as u64;
    let response_size = 2_000_000u64;
    let cycles = 400_000_000 + (request_size + response_size) * 600_000;

    let request = CanisterHttpRequestArgument {
        url: OLLAMA_URL.to_string(),
        method: HttpMethod::POST,
        body: Some(request_body_bytes),
        max_response_bytes: Some(response_size),
        transform: None,
        headers: vec![HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        }],
    };

    let (response,) = http_request(request, cycles.into()).await.map_err(|(r, m)|
        format!("Failed to connect to Ollama: {:?} - {}", r, m)
    )?;

    if response.status != candid::Nat::from(200usize) {
        return Err(format!("Ollama API error: {}", response.status));
    }

    let response_body = String::from_utf8(response.body).map_err(|e|
        format!("Failed to parse response body: {}", e)
    )?;

    let json_response: serde_json::Value = serde_json
        ::from_str(&response_body)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    json_response["response"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "No 'response' field found in Ollama API response".to_string())
}
