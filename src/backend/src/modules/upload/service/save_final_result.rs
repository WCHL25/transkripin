use crate::{
    modules::upload::domain::entities::{ FinalResult, Summary, Transcription },
    UPLOADED_FILES,
    FINAL_RESULTS,
};

pub fn save_final_result(
    file_id: &str,
    transcription: Option<Transcription>,
    summary: Option<Summary>
) {
    let file_id = &file_id.to_string();
    let uploaded_file = UPLOADED_FILES.with(|files| files.borrow().get(file_id));

    if let Some(f) = uploaded_file {
        let final_result = FinalResult {
            file_id: f.id.clone(),
            owner: f.owner.clone(),
            filename: f.filename.clone(),
            content_type: f.content_type.clone(),
            size: f.size,
            uploaded_at: f.uploaded_at,
            transcription: transcription,
            summary: summary,
        };

        FINAL_RESULTS.with(|map| {
            map.borrow_mut().insert(file_id.to_string(), final_result);
        });
    }
}
