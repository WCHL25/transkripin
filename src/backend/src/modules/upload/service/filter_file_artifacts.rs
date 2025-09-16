use crate::modules::{
    FileArtifact,
    FileArtifactFilter,
    FileTypeFilter,
    LanguageFilter,
    SortOrderFilter,
};

pub fn filter_file_artifacts(
    mut artifacts: Vec<FileArtifact>,
    filter: Option<FileArtifactFilter>
) -> Vec<FileArtifact> {
    if let Some(filter) = filter {
        // File type filter
        if let Some(file_type) = filter.file_type {
            match file_type {
                FileTypeFilter::Video => {
                    artifacts.retain(|a| a.content_type.starts_with("video/"));
                }
                FileTypeFilter::Audio => {
                    artifacts.retain(|a| a.content_type.starts_with("audio/"));
                }
            }
        }

        // Language filter
        if let Some(language) = filter.language {
            match language {
                LanguageFilter::English => {
                    artifacts.retain(|a| {
                        a.transcription
                            .as_ref()
                            .map(|t| t.language.eq_ignore_ascii_case("en"))
                            .unwrap_or(false)
                    });
                }
                LanguageFilter::Indonesia => {
                    artifacts.retain(|a| {
                        a.transcription
                            .as_ref()
                            .map(|t| t.language.eq_ignore_ascii_case("id"))
                            .unwrap_or(false)
                    });
                }
            }
        }

        // Search filter
        if let Some(query) = filter.search {
            artifacts.retain(|a| {
                a.title.as_ref().map_or(false, |t| t.to_lowercase().contains(&query.to_lowercase()))
            });
        }

        // Sorting
        match filter.sort.unwrap_or(SortOrderFilter::Newest) {
            SortOrderFilter::Newest => artifacts.sort_by(|a, b| b.created_at.cmp(&a.created_at)),
            SortOrderFilter::Oldest => artifacts.sort_by(|a, b| a.created_at.cmp(&b.created_at)),
            SortOrderFilter::AlphabeticalAsc => {
                artifacts.sort_by(|a, b| {
                    a.title
                        .as_ref()
                        .unwrap_or(&a.filename)
                        .to_lowercase()
                        .cmp(&b.title.as_ref().unwrap_or(&b.filename).to_lowercase())
                });
            }
            SortOrderFilter::AlphabeticalDesc => {
                artifacts.sort_by(|a, b| {
                    b.title
                        .as_ref()
                        .unwrap_or(&b.filename)
                        .to_lowercase()
                        .cmp(&a.title.as_ref().unwrap_or(&a.filename).to_lowercase())
                });
            }
        }
    } else {
        // Default sort
        artifacts.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    }

    artifacts
}
