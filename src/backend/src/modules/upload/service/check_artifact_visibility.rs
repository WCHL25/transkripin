use candid::Principal;

use crate::{ modules::upload::domain::entities::FileArtifactVisibility, FILE_ARTIFACTS };

pub fn check_artifact_visibility(file_id: &String, caller: Principal) -> Result<(), String> {
    FILE_ARTIFACTS.with(|a| {
        let artifacts = a.borrow();
        match artifacts.get(file_id) {
            Some(artifact) => {
                if
                    artifact.visibility == FileArtifactVisibility::Private &&
                    artifact.owner != caller
                {
                    Err("Unauthorized: File is private".to_string())
                } else {
                    Ok(())
                }
            }
            None => Err("Artifact not found".to_string()),
        }
    })
}
