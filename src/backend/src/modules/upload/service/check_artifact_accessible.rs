use candid::Principal;

use crate::modules::upload::entities::FileArtifact;

pub fn check_artifact_accessible(caller: &Principal, artifact: &FileArtifact) -> bool {
    artifact.visibility.is_public() || artifact.owner == *caller
}
