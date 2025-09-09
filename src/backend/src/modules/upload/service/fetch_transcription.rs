use ic_cdk::api::management_canister::http_request::{
    http_request,
    CanisterHttpRequestArgument,
    HttpMethod,
    HttpResponse,
};

use crate::common::TRANSCRIPTION_URL;

pub async fn fetch_transcription_api<T, F>(
    job_id: &str,
    endpoint: &str,
    parse_fn: F
) -> Result<T, String>
    where F: FnOnce(String) -> Result<T, String>
{
    let response_size = 2_000_000u64;
    let cycles = 400_000_000 + response_size * 600_000;

    let req = CanisterHttpRequestArgument {
        url: format!("{}/{}/{}", TRANSCRIPTION_URL, endpoint, job_id),
        method: HttpMethod::GET,
        headers: vec![],
        body: None,
        max_response_bytes: Some(response_size),
        transform: None,
    };

    let (res,): (HttpResponse,) = http_request(req, cycles.into()).await.map_err(|e|
        format!("{} request failed: {:?}", endpoint, e)
    )?;

    let body_str = String::from_utf8(res.body).map_err(|_|
        format!("Invalid UTF-8 in {} response", endpoint)
    )?;

    parse_fn(body_str)
}
