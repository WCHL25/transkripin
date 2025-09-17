use crate::modules::{
    FileArtifact,
    FileArtifactFilter,
    FileTypeFilter,
    LanguageFilter,
    SortOrderFilter,
};

/// Apply all filters and sorting to a list of file artifacts
pub fn filter_file_artifacts(
    mut artifacts: Vec<FileArtifact>,
    filter: Option<FileArtifactFilter>
) -> Vec<FileArtifact> {
    if let Some(filter) = filter {
        // File type filter
        if let Some(file_type) = filter.file_type {
            artifacts.retain(|a| matches_file_type(a, file_type));
        }

        // Language filter
        if let Some(language) = filter.language {
            artifacts.retain(|a| matches_language(a, language));
        }

        // Search filter
        if let Some(query) = filter.search {
            let q = query.to_lowercase();
            artifacts.retain(|a| matches_search(a, &q));
        }

        sort_artifacts(&mut artifacts, filter.sort.unwrap_or(SortOrderFilter::Newest));
    } else {
        // Default sort: newest
        sort_artifacts(&mut artifacts, SortOrderFilter::Newest);
    }

    artifacts
}

/// Filter by file type (video/audio)
fn matches_file_type(artifact: &FileArtifact, file_type: FileTypeFilter) -> bool {
    match file_type {
        FileTypeFilter::Video => artifact.content_type.starts_with("video/"),
        FileTypeFilter::Audio => artifact.content_type.starts_with("audio/"),
    }
}

/// Filter by transcription language
fn matches_language(artifact: &FileArtifact, language: LanguageFilter) -> bool {
    match artifact.transcription.as_ref().map(|t| t.language.as_str()) {
        Some(lang) =>
            match language {
                LanguageFilter::English => lang.eq_ignore_ascii_case("en"),
                LanguageFilter::Indonesia => lang.eq_ignore_ascii_case("id"),
            }
        None => false,
    }
}

/// Filter by search query (title or filename)
fn matches_search(artifact: &FileArtifact, query: &str) -> bool {
    artifact.title
        .as_ref()
        .map(|t| t.to_lowercase().contains(query))
        .unwrap_or(false) || artifact.filename.to_lowercase().contains(query)
}

/// Apply sorting order
fn sort_artifacts(artifacts: &mut Vec<FileArtifact>, sort: SortOrderFilter) {
    match sort {
        SortOrderFilter::Newest => {
            artifacts.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        }
        SortOrderFilter::Oldest => {
            artifacts.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        }
        SortOrderFilter::AlphabeticalAsc => {
            artifacts.sort_by(|a, b| { title_or_filename(a).cmp(&title_or_filename(b)) });
        }
        SortOrderFilter::AlphabeticalDesc => {
            artifacts.sort_by(|a, b| { title_or_filename(b).cmp(&title_or_filename(a)) });
        }
    }
}

/// Helper to pick a display string for sorting (title ?? filename)
fn title_or_filename(artifact: &FileArtifact) -> String {
    artifact.title.as_ref().unwrap_or(&artifact.filename).to_lowercase()
}
