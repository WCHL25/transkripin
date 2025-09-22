use candid::Principal;

use crate::{ modules::upload::service::check_artifact_accessible, FILE_ARTIFACTS };

pub fn check_artifact_visibility(file_id: &String, caller: Principal) -> Result<(), String> {
    FILE_ARTIFACTS.with(|a| {
        let artifacts = a.borrow();
        match artifacts.get(file_id) {
            Some(artifact) => {
                if !check_artifact_accessible(&caller, &artifact) {
                    Err("Unauthorized: File is private".to_string())
                } else {
                    Ok(())
                }
            }
            None => Err("Artifact not found".to_string()),
        }
    })
}
