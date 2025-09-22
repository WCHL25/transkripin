// useChunkedMedia.ts
import { ActorSubclass } from "@dfinity/agent";
import {
   _SERVICE,
   DownloadChunkRequest,
   FileArtifact,
} from "declarations/backend/backend.did";
import { useState, useCallback, useRef, useEffect } from "react";

interface UseChunkedMediaOptions {
   chunkSize?: number;
   preloadChunks?: number;
   autoLoad?: boolean;
}

interface UseChunkedMediaReturn {
   mediaUrl: string | null;
   isLoading: boolean;
   loadingProgress: number;
   error: string | null;
   loadMedia: () => Promise<void>;
   loadCompleteFile: () => Promise<void>;
   reset: () => void;
   downloadFile: () => void;
   totalSize: bigint | null;
   loadedSize: bigint;
}

export const useChunkedMedia = (
   fileArtifact: FileArtifact | null,
   backendActor: ActorSubclass<_SERVICE>,
   options: UseChunkedMediaOptions = {}
): UseChunkedMediaReturn => {
   const {
      chunkSize = 1024 * 1024, // 1MB
      preloadChunks = 3,
      autoLoad = true,
   } = options;

   const [mediaUrl, setMediaUrl] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [loadingProgress, setLoadingProgress] = useState(0);
   const [error, setError] = useState<string | null>(null);
   const [totalSize, setTotalSize] = useState<bigint | null>(null);
   const [loadedSize, setLoadedSize] = useState<bigint>(BigInt(0));

   const chunksRef = useRef<Map<number, Uint8Array>>(new Map());
   const loadingRef = useRef<boolean>(false);
   const abortControllerRef = useRef<AbortController | null>(null);

   // Convert data to Uint8Array - handle both Uint8Array and number[] types
   const ensureUint8Array = useCallback(
      (data: Uint8Array | number[]): Uint8Array => {
         if (data instanceof Uint8Array) {
            return data;
         }
         // If it's a number array, convert to Uint8Array
         return new Uint8Array(data);
      },
      []
   );

   const fetchChunk = useCallback(
      async (chunkIndex: number, signal?: AbortSignal): Promise<Uint8Array> => {
         if (!fileArtifact) throw new Error("No file artifact provided");

         // Convert to BigInt as required by backend
         const start = BigInt(chunkIndex * chunkSize);
         const length = BigInt(
            Math.min(
               chunkSize,
               Number(fileArtifact.size) - chunkIndex * chunkSize
            )
         );

         const request: DownloadChunkRequest = {
            file_id: fileArtifact.file_id,
            start,
            length,
         };

         try {
            const response = await backendActor.get_file_chunk(request);

            if (signal?.aborted) {
               throw new Error("Request aborted");
            }

            // Handle Result type
            if ("Err" in response) {
               throw new Error(`Backend error: ${response.Err}`);
            }

            if ("Ok" in response) {
               const responseData = response.Ok;
               console.log("responseData", responseData);

               // Update total size from response if available
               if (responseData.total_size && !totalSize) {
                  setTotalSize(responseData.total_size);
               }

               const chunkData = ensureUint8Array(responseData.data);
               chunksRef.current.set(chunkIndex, chunkData);

               // Update loaded size
               setLoadedSize((prev) => prev + BigInt(chunkData.byteLength));

               return chunkData;
            }

            throw new Error("Unknown response format");
         } catch (err) {
            if (signal?.aborted) {
               throw new Error("Request aborted");
            }
            throw new Error(
               `Failed to fetch chunk ${chunkIndex}: ${
                  err instanceof Error ? err.message : String(err)
               }`
            );
         }
      },
      [fileArtifact, chunkSize, backendActor, ensureUint8Array, totalSize]
   );

   const loadMedia = useCallback(async () => {
      if (!fileArtifact || loadingRef.current) return;

      console.log('loading...')

      // Cancel any ongoing request
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);
      setLoadedSize(BigInt(0));

      try {
         const totalChunks = Math.ceil(Number(fileArtifact.size) / chunkSize);
         const chunksToLoad = Math.min(preloadChunks, totalChunks);

         const chunkPromises = [];
         for (let i = 0; i < chunksToLoad; i++) {
            chunkPromises.push(fetchChunk(i, signal));
         }

         const chunks = await Promise.all(chunkPromises);

         if (signal.aborted) return;

         const blob = new Blob(chunks as BlobPart[], {
            type: fileArtifact.content_type,
         });
         const url = URL.createObjectURL(blob);

         // Clean up old URL
         if (mediaUrl) {
            URL.revokeObjectURL(mediaUrl);
         }

         setMediaUrl(url);
         console.log('media url', url)
         setLoadingProgress(100);
         setIsLoading(false);
      } catch (err) {
         if (signal.aborted) return;

         console.error("Error loading media:", err);
         setError(err instanceof Error ? err.message : "Failed to load media");
         setIsLoading(false);
      } finally {
         if (!signal.aborted) {
            loadingRef.current = false;
         }
      }
   }, [fileArtifact, chunkSize, preloadChunks, fetchChunk, mediaUrl]);

   const loadCompleteFile = useCallback(async () => {
      if (!fileArtifact || loadingRef.current) return;

      // Cancel any ongoing request
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);
      setLoadedSize(BigInt(0));

      try {
         const totalChunks = Math.ceil(Number(fileArtifact.size) / chunkSize);
         const allChunks: Uint8Array[] = [];

         for (let i = 0; i < totalChunks; i++) {
            if (signal.aborted) return;

            let chunk = chunksRef.current.get(i);
            if (!chunk) {
               chunk = await fetchChunk(i, signal);
            }
            allChunks.push(chunk);

            const progress = ((i + 1) / totalChunks) * 100;
            setLoadingProgress(progress);
         }

         if (signal.aborted) return;

         const completeBlob = new Blob(allChunks as BlobPart[], {
            type: fileArtifact.content_type,
         });
         const completeUrl = URL.createObjectURL(completeBlob);

         // Clean up old URL
         if (mediaUrl) {
            URL.revokeObjectURL(mediaUrl);
         }

         setMediaUrl(completeUrl);
         setLoadingProgress(100);
         setIsLoading(false);
      } catch (err) {
         if (signal.aborted) return;

         console.error("Error loading complete file:", err);
         setError(
            err instanceof Error ? err.message : "Failed to load complete file"
         );
         setIsLoading(false);
      } finally {
         if (!signal.aborted) {
            loadingRef.current = false;
         }
      }
   }, [fileArtifact, chunkSize, fetchChunk, mediaUrl]);

   const reset = useCallback(() => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
         abortControllerRef.current.abort();
      }

      // Clean up URL
      if (mediaUrl) {
         URL.revokeObjectURL(mediaUrl);
      }

      // Reset state
      setMediaUrl(null);
      setIsLoading(false);
      setLoadingProgress(0);
      setError(null);
      setTotalSize(null);
      setLoadedSize(BigInt(0));

      // Clear cache
      chunksRef.current.clear();
      loadingRef.current = false;
   }, [mediaUrl]);

   const downloadFile = useCallback(() => {
      if (mediaUrl && fileArtifact) {
         const link = document.createElement("a");
         link.href = mediaUrl;
         link.download = fileArtifact.filename;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
      }
   }, [mediaUrl, fileArtifact]);

   // Auto-load on file change
   useEffect(() => {
      if (fileArtifact && autoLoad) {
         loadMedia();
      } else {
         reset();
      }

      return () => {
         // Cleanup on unmount or file change
         if (abortControllerRef.current) {
            abortControllerRef.current.abort();
         }
      };
   }, [fileArtifact, autoLoad]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         if (abortControllerRef.current) {
            abortControllerRef.current.abort();
         }
         if (mediaUrl) {
            URL.revokeObjectURL(mediaUrl);
         }
      };
   }, [mediaUrl]);

   return {
      mediaUrl,
      isLoading,
      loadingProgress,
      error,
      loadMedia,
      loadCompleteFile,
      reset,
      downloadFile,
      totalSize,
      loadedSize,
   };
};
