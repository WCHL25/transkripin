use crate::{
    modules::{
        upload::domain::entities::{ FileArtifact, FileArtifactRequest },
        FileArtifactVisibility,
    },
    FILE_ARTIFACTS,
    UPLOADED_FILES,
};

pub fn save_file_artifact(request: FileArtifactRequest) {
    let file_id = &request.file_id.to_string();
    let uploaded_file = UPLOADED_FILES.with(|files| files.borrow().get(file_id));

    if let Some(f) = uploaded_file {
        let file_artifact = FileArtifact {
            file_id: f.id.clone(),
            owner: f.owner.clone(),
            filename: f.filename.clone(),
            content_type: f.content_type.clone(),
            size: f.size,
            created_at: f.created_at,
            deleted_at: f.deleted_at,
            title: request.title,
            transcription: request.transcription,
            summary: request.summary,
            visibility: FileArtifactVisibility::Private,
        };

        FILE_ARTIFACTS.with(|map| {
            map.borrow_mut().insert(file_id.to_string(), file_artifact);
        });
    }
}
