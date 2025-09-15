export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const UploadedFile = IDL.Record({
    'id' : IDL.Text,
    'owner' : IDL.Principal,
    'data' : IDL.Vec(IDL.Nat8),
    'size' : IDL.Nat64,
    'content_type' : IDL.Text,
    'created_at' : IDL.Nat64,
    'filename' : IDL.Text,
    'deleted_at' : IDL.Opt(IDL.Nat64),
  });
  const Result_1 = IDL.Variant({ 'Ok' : UploadedFile, 'Err' : IDL.Text });
  const Summary = IDL.Record({
    'text' : IDL.Text,
    'created_at' : IDL.Nat64,
    'deleted_at' : IDL.Opt(IDL.Nat64),
    'file_id' : IDL.Text,
  });
  const Transcription = IDL.Record({
    'text' : IDL.Text,
    'created_at' : IDL.Nat64,
    'job_id' : IDL.Text,
    'deleted_at' : IDL.Opt(IDL.Nat64),
    'file_id' : IDL.Text,
  });
  const FileArtifact = IDL.Record({
    'title' : IDL.Opt(IDL.Text),
    'owner' : IDL.Principal,
    'size' : IDL.Nat64,
    'content_type' : IDL.Text,
    'created_at' : IDL.Nat64,
    'filename' : IDL.Text,
    'summary' : IDL.Opt(Summary),
    'transcription' : IDL.Opt(Transcription),
    'deleted_at' : IDL.Opt(IDL.Nat64),
    'file_id' : IDL.Text,
  });
  const JobStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'Completed' : IDL.Text,
    'Pending' : IDL.Null,
  });
  const Result_2 = IDL.Variant({ 'Ok' : JobStatus, 'Err' : IDL.Text });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Tuple(IDL.Nat64, IDL.Nat64),
    'Err' : IDL.Text,
  });
  const StartUploadRequest = IDL.Record({
    'total_chunks' : IDL.Nat64,
    'content_type' : IDL.Text,
    'total_size' : IDL.Nat64,
    'filename' : IDL.Text,
  });
  const UploadChunkRequest = IDL.Record({
    'chunk_index' : IDL.Nat64,
    'session_id' : IDL.Text,
    'data' : IDL.Vec(IDL.Nat8),
  });
  return IDL.Service({
    'complete_upload' : IDL.Func([IDL.Text], [Result], []),
    'delete_file' : IDL.Func([IDL.Text], [Result], []),
    'get_file' : IDL.Func([IDL.Text], [Result_1], ['query']),
    'get_file_artifact' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(FileArtifact)],
        ['query'],
      ),
    'get_summary_result' : IDL.Func([IDL.Text], [Result], ['query']),
    'get_transcription' : IDL.Func([IDL.Text], [Result], ['query']),
    'get_transcription_result' : IDL.Func([IDL.Text], [Result], []),
    'get_transcription_status' : IDL.Func([IDL.Text], [Result_2], []),
    'get_upload_status' : IDL.Func([IDL.Text], [Result_3], ['query']),
    'get_user_id' : IDL.Func([IDL.Principal], [IDL.Text], ['query']),
    'list_files' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text, IDL.Text, IDL.Nat64))],
        ['query'],
      ),
    'list_user_file_artifacts' : IDL.Func(
        [],
        [IDL.Vec(FileArtifact)],
        ['query'],
      ),
    'login' : IDL.Func([], [IDL.Text], []),
    'logout' : IDL.Func([], [IDL.Text], []),
    'start_summarization' : IDL.Func([IDL.Text], [Result], []),
    'start_transcription' : IDL.Func([IDL.Text], [Result], []),
    'start_upload' : IDL.Func([StartUploadRequest], [Result], []),
    'upload_chunk' : IDL.Func([UploadChunkRequest], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
