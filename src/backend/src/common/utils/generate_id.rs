use ic_cdk::api;

pub fn generate_id() -> String {
    let time = api::time();
    let caller = api::caller();
    format!("{}-{}", time, caller.to_text())
}
