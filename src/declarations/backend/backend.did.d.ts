import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : UploadedFile } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : [bigint, bigint] } |
  { 'Err' : string };
export interface StartUploadRequest {
  'total_chunks' : bigint,
  'content_type' : string,
  'total_size' : bigint,
  'filename' : string,
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
  'filename' : string,
  'uploaded_at' : bigint,
}
export interface _SERVICE {
  'complete_upload' : ActorMethod<[string], Result>,
  'delete_file' : ActorMethod<[string], Result>,
  'get_file' : ActorMethod<[string], Result_1>,
  'get_upload_status' : ActorMethod<[string], Result_2>,
  'list_files' : ActorMethod<[], Array<[string, string, string, bigint]>>,
  'start_upload' : ActorMethod<[StartUploadRequest], Result>,
  'upload_chunk' : ActorMethod<[UploadChunkRequest], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
