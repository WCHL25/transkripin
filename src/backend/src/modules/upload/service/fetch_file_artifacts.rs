use crate::{
    modules::upload::domain::entities::{ FileArtifact, FileArtifactFilter, UserFileArtifact },
    USER_BOOKMARKS,
    FILE_ARTIFACTS,
};

use super::filter_file_artifacts;

/// Generic helper to fetch artifacts and include bookmark info
pub fn fetch_file_artifacts<F>(
    filter_fn: F,
    artifact_filter: Option<FileArtifactFilter>
) -> Vec<UserFileArtifact>
    where F: Fn(&FileArtifact) -> bool
{
    let caller = ic_cdk::api::caller();

    // Collect artifacts that satisfy the filter function
    let artifacts: Vec<FileArtifact> = FILE_ARTIFACTS.with(|map| {
        map.borrow()
            .values()
            .filter(|artifact| filter_fn(artifact))
            .collect()
    });

    // Apply optional artifact filter
    let filtered: Vec<FileArtifact> = filter_file_artifacts(artifacts, artifact_filter);

    // Get caller’s bookmarks once
    let user_bookmarks: Vec<String> = USER_BOOKMARKS.with(|ub| {
        ub.borrow()
            .get(&caller)
            .map(|entry| entry.file_ids.clone())
            .unwrap_or_default()
    });

    // Map each artifact to include bookmark info
    filtered
        .into_iter()
        .map(|artifact| {
            let is_bookmarked = user_bookmarks.contains(&artifact.file_id);
            UserFileArtifact { artifact, is_bookmarked }
        })
        .collect()
}
