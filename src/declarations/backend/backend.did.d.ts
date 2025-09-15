import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface FileArtifact {
  'title' : [] | [string],
  'owner' : Principal,
  'size' : bigint,
  'content_type' : string,
  'created_at' : bigint,
  'filename' : string,
  'summary' : [] | [Summary],
  'transcription' : [] | [Transcription],
  'deleted_at' : [] | [bigint],
  'file_id' : string,
}
export type JobStatus = { 'Failed' : string } |
  { 'Completed' : string } |
  { 'Pending' : null };
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : UploadedFile } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : JobStatus } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : [bigint, bigint] } |
  { 'Err' : string };
export interface StartUploadRequest {
  'total_chunks' : bigint,
  'content_type' : string,
  'total_size' : bigint,
  'filename' : string,
}
export interface Summary {
  'text' : string,
  'created_at' : bigint,
  'deleted_at' : [] | [bigint],
  'file_id' : string,
}
export interface Transcription {
  'text' : string,
  'created_at' : bigint,
  'job_id' : string,
  'deleted_at' : [] | [bigint],
  'file_id' : string,
}
export interface UploadChunkRequest {
  'chunk_index' : bigint,
  'session_id' : string,
  'data' : Uint8Array | number[],
}
export interface UploadedFile {
  'id' : string,
  'owner' : Principal,
  'data' : Uint8Array | number[],
  'size' : bigint,
  'content_type' : string,
  'created_at' : bigint,
  'filename' : string,
  'deleted_at' : [] | [bigint],
}
export interface _SERVICE {
  'complete_upload' : ActorMethod<[string], Result>,
  'delete_file' : ActorMethod<[string], Result>,
  'get_file' : ActorMethod<[string], Result_1>,
  'get_file_artifact' : ActorMethod<[string], [] | [FileArtifact]>,
  'get_summary_result' : ActorMethod<[string], Result>,
  'get_transcription' : ActorMethod<[string], Result>,
  'get_transcription_result' : ActorMethod<[string], Result>,
  'get_transcription_status' : ActorMethod<[string], Result_2>,
  'get_upload_status' : ActorMethod<[string], Result_3>,
  'get_user_id' : ActorMethod<[Principal], string>,
  'list_files' : ActorMethod<[], Array<[string, string, string, bigint]>>,
  'list_user_file_artifacts' : ActorMethod<[], Array<FileArtifact>>,
  'login' : ActorMethod<[], string>,
  'logout' : ActorMethod<[], string>,
  'start_summarization' : ActorMethod<[string], Result>,
  'start_transcription' : ActorMethod<[string], Result>,
  'start_upload' : ActorMethod<[StartUploadRequest], Result>,
  'upload_chunk' : ActorMethod<[UploadChunkRequest], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
