use crate::{
    modules::{
        upload::domain::entities::{
            Bookmark,
            FileArtifact,
            FileArtifactFilter,
            FileArtifactWithMeta,
        },
    },
    BOOKMARKS,
    FILE_ARTIFACTS,
};

use super::filter_file_artifacts;

/// Generic helper to fetch artifacts and include bookmark info
pub fn fetch_file_artifacts_with_bookmark<F>(
    filter_fn: F,
    artifact_filter: Option<FileArtifactFilter>
) -> Vec<FileArtifactWithMeta>
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

    // Map each filtered artifact to include bookmark info
    BOOKMARKS.with(|bookmarks| {
        let store = bookmarks.borrow();
        filtered
            .into_iter()
            .map(|artifact| {
                let is_bookmarked = store.contains_key(
                    &(Bookmark {
                        user: caller,
                        file_id: artifact.file_id.clone(),
                    })
                );
                FileArtifactWithMeta { artifact, is_bookmarked }
            })
            .collect()
    })
}
