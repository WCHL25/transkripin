use ic_cdk::api::management_canister::http_request::{
    http_request,
    CanisterHttpRequestArgument,
    HttpHeader,
    HttpMethod,
    HttpResponse,
};
use crate::{
    common::constants::uri::TRANSCRIPTION_URL,
    modules::upload::domain::entities::FileChunk,
    FILE_CHUNKS,
    UPLOADED_FILES,
};

pub async fn call_transcription(file_id: String) -> Result<String, String> {
    // Load metadata
    let file = UPLOADED_FILES.with(|files| {
        files.borrow().get(&file_id).ok_or("File not found".to_string())
    })?;

    let boundary = "----ic_boundary";
    let session_id = file.id.clone();

    for chunk_index in 0..file.total_chunks {
        let key = FileChunk {
            id: file.id.clone(),
            chunk_index: chunk_index,
        };

        // Fetch chunk from stable storage
        let chunk = FILE_CHUNKS.with(|chunks| {
            chunks.borrow().get(&key).ok_or(format!("Chunk {} not found", chunk_index))
        })?;

        // Build multipart body for chunk
        let mut body = Vec::new();

        // Session ID
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Disposition: form-data; name=\"session_id\"\r\n\r\n");
        body.extend_from_slice(session_id.as_bytes());
        body.extend_from_slice(b"\r\n");

        // Chunk index
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Disposition: form-data; name=\"chunk_index\"\r\n\r\n");
        body.extend_from_slice(chunk_index.to_string().as_bytes());
        body.extend_from_slice(b"\r\n");

        // Chunk data
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(
            format!(
                "Content-Disposition: form-data; name=\"file\"; filename=\"{}\"\r\n",
                file.filename
            ).as_bytes()
        );
        body.extend_from_slice(format!("Content-Type: {}\r\n\r\n", file.content_type).as_bytes());
        body.extend_from_slice(&chunk);
        body.extend_from_slice(b"\r\n");
        body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

        // Calculate cycles
        let request_size = body.len() as u64;
        let response_size = 2_000_000u64;
        let cycles = 400_000_000 + (request_size + response_size) * 600_000;
        ic_cdk::println!(
            "Estimated cycles for HTTP request: {} (request_size: {} bytes)",
            cycles,
            request_size
        );

        // Construct request
        let request = CanisterHttpRequestArgument {
            url: format!("{}/upload_chunk", TRANSCRIPTION_URL),
            method: HttpMethod::POST,
            headers: vec![HttpHeader {
                name: "Content-Type".to_string(),
                value: format!("multipart/form-data; boundary={}", boundary),
            }],
            body: Some(body),
            max_response_bytes: Some(response_size),
            transform: None,
        };

        http_request(request, cycles.into()).await.map_err(|e|
            format!("Chunk {} upload failed: {:?}", chunk_index, e)
        )?;
    }

    // Tell server we're done uploading
    let finalize_body = serde_json
        ::to_vec(&serde_json::json!({ "session_id": session_id }))
        .unwrap();
    let request_size = finalize_body.len() as u64;
    let response_size = 2_000_000u64;
    let cycles = 400_000_000 + (request_size + response_size) * 600_000;

    let finalize_request = CanisterHttpRequestArgument {
        url: format!("{}/finalize_upload", TRANSCRIPTION_URL),
        method: HttpMethod::POST,
        headers: vec![HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        }],
        body: Some(finalize_body),
        max_response_bytes: Some(response_size),
        transform: None,
    };

    let (response,): (HttpResponse,) = http_request(finalize_request, cycles.into()).await.map_err(
        |e| format!("Finalize request failed: {:?}", e)
    )?;

    let finalize_result = String::from_utf8(response.body).map_err(|_|
        "Invalid UTF-8 in finalize response".to_string()
    )?;

    let job_id: String = serde_json
        ::from_str::<serde_json::Value>(&finalize_result)
        .map_err(|_| "Invalid JSON in finalize response".to_string())?
        .get("message")
        .and_then(|m| m.as_str())
        .and_then(|m| m.strip_prefix("Job started with ID: "))
        .ok_or("Missing job_id in finalize response".to_string())?
        .to_string();

    Ok(job_id)
}
