export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const UploadedFile = IDL.Record({
    'id' : IDL.Text,
    'owner' : IDL.Principal,
    'data' : IDL.Vec(IDL.Nat8),
    'size' : IDL.Nat64,
    'content_type' : IDL.Text,
    'filename' : IDL.Text,
    'uploaded_at' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : UploadedFile, 'Err' : IDL.Text });
  const Result_2 = IDL.Variant({
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
    'cleanup_old_sessions' : IDL.Func([], [IDL.Text], []),
    'complete_upload' : IDL.Func([IDL.Text], [Result], []),
    'delete_file' : IDL.Func([IDL.Text], [Result], []),
    'get_file' : IDL.Func([IDL.Text], [Result_1], ['query']),
    'get_upload_status' : IDL.Func([IDL.Text], [Result_2], ['query']),
    'list_files' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text, IDL.Text, IDL.Nat64))],
        ['query'],
      ),
    'start_upload' : IDL.Func([StartUploadRequest], [Result], []),
    'upload_chunk' : IDL.Func([UploadChunkRequest], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
