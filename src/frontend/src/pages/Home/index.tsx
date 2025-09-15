import {
   Box,
   Button,
   Typography,
   LinearProgress,
   CircularProgress,
} from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import { FaCloudUploadAlt } from "react-icons/fa";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { fileToChunks } from "@/utils/fileUtils";
import Result from "@/pages/Home/components/Result";
import { useBackend } from "@/hooks/useBackend";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import { useNavigate } from "react-router-dom";

const Home = () => {
   const [file, setFile] = useState<File | null>(null);
   const [videoUrl, setVideoUrl] = useState("");
   const [result, setResult] = useState<string>("");
   const [uploading, setUploading] = useState(false);
   const [uploadProgress, setUploadProgress] = useState(0);
   const [uploadStatus, setUploadStatus] = useState(""); // 'idle', 'uploading', 'processing', 'complete', 'error'

   const inputRef = useRef<HTMLInputElement | null>(null);

   const setSnackbar = useSnackbarStore((state) => state.setSnackbar);
   const navigate = useNavigate();

   const removeFile = () => {
      setFile(null);
      const dt = new DataTransfer();
      if (inputRef.current) {
         inputRef.current.files = dt.files;
      }
   };

   const validateFile = (file: File) => {
      if (!file.type.startsWith("video") && !file.type.startsWith("audio")) {
         removeFile();
         setSnackbar({
            message: "File type not valid. Must be a video or audio.",
         });
         return false;
      }

      // Check file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
         removeFile();
         setSnackbar({
            message: "File size too large. Maximum size is 100MB.",
         });
         return false;
      }

      return true;
   };

   const backend = useBackend();

   const uploadFile = async (file: File) => {
      try {
         setUploading(true);
         setUploadStatus("uploading");
         setUploadProgress(0);

         // Optimize chunk size - larger chunks for better performance
         const CHUNK_SIZE = 1024 * 1024; // 1MB chunks instead of default small chunks
         const chunks = await fileToChunks(file, CHUNK_SIZE);
         const totalChunks = chunks.length;

         console.log(
            `File size: ${file.size} bytes, Chunks: ${totalChunks}, Chunk size: ${CHUNK_SIZE}`
         );

         // Start upload session
         const uploadSession = await backend.start_upload({
            filename: file.name,
            content_type: file.type,
            total_size: BigInt(file.size),
            total_chunks: BigInt(totalChunks),
         });

         if ("Err" in uploadSession) {
            throw new Error(uploadSession.Err);
         }

         const sessionId = uploadSession.Ok;

         console.log("Upload session started, ID:", sessionId);

         // Track upload progress properly
         let completedChunks = 0;
         const progressLock = { current: 0 }; // Prevent progress from going backwards

         const updateProgress = () => {
            const newProgress = Math.min(
               (completedChunks / totalChunks) * 70,
               70
            );
            if (newProgress > progressLock.current) {
               progressLock.current = newProgress;
               setUploadProgress(newProgress);
            }
         };

         // Upload chunks in parallel batches for better performance
         const BATCH_SIZE = 5; // Upload 3 chunks simultaneously

         for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(
               i,
               Math.min(i + BATCH_SIZE, chunks.length)
            );
            const batchPromises = batch.map(async (chunk, batchIndex) => {
               const chunkIndex = i + batchIndex;

               try {
                  const result = await backend.upload_chunk({
                     session_id: sessionId,
                     chunk_index: BigInt(chunkIndex),
                     data: chunk,
                  });

                  if ("Err" in result) {
                     throw new Error(
                        `Chunk ${chunkIndex} failed: ${result.Err}`
                     );
                  }

                  // Atomic increment and progress update
                  completedChunks++;
                  updateProgress();

                  return result;
               } catch (error) {
                  console.error(`Chunk ${chunkIndex} upload failed:`, error);
                  throw error;
               }
            });

            // Wait for current batch to complete before starting next batch
            await Promise.all(batchPromises);

            // Small delay to prevent overwhelming the backend
            if (i + BATCH_SIZE < chunks.length) {
               await new Promise((resolve) => setTimeout(resolve, 50));
            }
         }

         // Complete upload
         setUploadStatus("processing");
         setUploadProgress(75);

         const completeResult = await backend.complete_upload(sessionId);
         if ("Err" in completeResult) throw new Error(completeResult.Err);
         const fileId = completeResult.Ok;

         console.log("UploadedFile", fileId);

         // Start transcription
         console.log("Starting transcription...");
         setUploadProgress(80);

         const startTranscribeJob = await backend.start_transcription(fileId);
         if ("Err" in startTranscribeJob) {
            throw new Error(startTranscribeJob.Err);
         }
         const transcribeJobId = startTranscribeJob.Ok;

         // Optimized polling with exponential backoff
         let pollInterval = 2000; // Start with 2 seconds
         const maxInterval = 10000; // Max 10 seconds

         while (true) {
            const statusResult = await backend.get_transcription_status(
               transcribeJobId
            );

            if ("Err" in statusResult) throw new Error(statusResult.Err);
            const status = statusResult.Ok;

            if ("Pending" in status) {
               console.log("Transcription in progress...");
               await new Promise((resolve) =>
                  setTimeout(resolve, pollInterval)
               );
               // Gradually increase poll interval to reduce backend load
               pollInterval = Math.min(pollInterval * 1.2, maxInterval);
               continue;
            }

            if ("Completed" in status) {
               console.log("✅ Transcription completed");
               break;
            }

            if ("Failed" in status) {
               throw new Error(`Transcription failed: ${status.Failed}`);
            }
         }

         // Fetch transcription result
         setUploadProgress(90);
         const transcriptionResult = await backend.get_transcription_result(
            transcribeJobId
         );
         console.log("Transcription result:", transcriptionResult);

         if ("Err" in transcriptionResult) {
            throw new Error(transcriptionResult.Err);
         }

         // Start summarization
         console.log("Starting summarization...");
         setUploadProgress(95);

         const startSummaryJob = await backend.start_summarization(fileId);
         if ("Err" in startSummaryJob) throw new Error(startSummaryJob.Err);

         // Optimized polling for summary
         pollInterval = 1000; // Reset to 1 second for summary
         let fileArtifact: string | null = null;

         while (true) {
            console.log("Trying to get summary...");
            const summaryResult = await backend.get_summary_result(fileId);
            console.log("Summary result:", summaryResult);
            if ("Ok" in summaryResult) {
               fileArtifact = summaryResult.Ok;
               if (fileArtifact.startsWith("Err")) {
                  console.error(fileArtifact);
                  break;
               }
               break;
            }

            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            pollInterval = Math.min(pollInterval * 1.1, 5000); // Max 5 seconds for summary
         }

         console.log("Summary result", fileArtifact);
         console.log("Summary completed");

         setUploadProgress(100);
         setUploadStatus("complete");
         setResult(fileArtifact!);

         setSnackbar({
            message: "File processed successfully!",
         });

         const url = URL.createObjectURL(file);
         setVideoUrl(url);

         navigate(`/works/${fileId}`, {
            state: {
               videoUrl: url,
               summary: fileArtifact,
               filename: file.name,
               fileSize: file.size,
               fileType: file.type,
            },
         });

         // Smooth scroll to results
         setTimeout(() => {
            window.scrollTo({ behavior: "smooth", top: 1000 });
         }, 500);
      } catch (error: any) {
         console.error("Upload error:", error);
         setUploadStatus("error");
         setUploadProgress(0);
         setSnackbar({
            message: `Upload failed: ${error.message}`,
         });
      } finally {
         setUploading(false);
      }
   };

   const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      const droppedFile = e.dataTransfer.files[0];

      if (droppedFile && validateFile(droppedFile)) {
         setFile(droppedFile);
      } else if (!droppedFile) {
         setFile(null);
      }
   };

   const handleClick = () => {
      if (uploading) return;
      inputRef.current?.click();
   };

   const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];

      if (selectedFile && validateFile(selectedFile)) {
         setFile(selectedFile);
      } else if (!selectedFile) {
         setFile(null);
      }
   };

   const handleUpload = () => {
      if (file && !uploading) {
         uploadFile(file);
      }
   };

   const getStatusMessage = () => {
      switch (uploadStatus) {
         case "uploading":
            return "Uploading file...";
         case "processing":
            return "Processing file...";
         case "complete":
            return "Upload completed!";
         case "error":
            return "Upload failed";
         default:
            return "";
      }
   };

   useEffect(() => {
      handleUpload();
   }, [file]);

   return (
      <>
         <Box component="main" className="px-5 relative overflow-hidden">
            <Box className="bg-background3/30 blur-[70px] absolute -top-20 rounded-full w-[1200px] h-96 left-1/2 -translate-x-1/2 -z-10"></Box>

            <Box className="min-h-dvh grid place-items-center py-20 text-center">
               <Box className="w-full">
                  <Box className="max-w-[800px] mx-auto">
                     <Typography
                        variant="h3"
                        className="font-extrabold mb-7 uppercase"
                     >
                        Summary & Transcript
                     </Typography>
                     <Typography
                        variant="h6"
                        className="mb-20 text-foreground/70"
                     >
                        Transcribes audio/video into accurate text, backends it
                        into clear points, and makes content searchable and
                        shareable with multi-language support for greater
                        accessibility
                     </Typography>
                  </Box>

                  <Box
                     component="div"
                     className="aspect-video border-primary border-dashed border rounded-[50px] p-8 w-full max-w-[700px] mx-auto"
                     onDrop={handleDrop}
                     onDragOver={(e) => e.preventDefault()}
                  >
                     {!file ? (
                        <Button
                           variant="contained"
                           className="w-full h-full !rounded-[24px] !grid place-items-center"
                           onClick={handleClick}
                           disabled={uploading}
                        >
                           <Box>
                              <input
                                 ref={inputRef}
                                 type="file"
                                 hidden
                                 onChange={handleChange}
                                 accept="video/*, audio/*"
                              />
                              <Box className="rounded-full p-5 bg-white mb-5 w-fit mx-auto">
                                 <FaPlus className="text-4xl text-black" />
                              </Box>
                              <Typography variant="body1">
                                 Upload or drag & drop video or audio
                              </Typography>
                           </Box>
                        </Button>
                     ) : (
                        <Box className="h-full flex flex-col justify-center items-center space-y-4">
                           {/* File Info */}
                           <Box className="text-center">
                              <Typography variant="h6" className="mb-2">
                                 {file.name}
                              </Typography>
                              <Typography
                                 variant="body2"
                                 className="text-gray-600"
                              >
                                 Size: {(file.size / (1024 * 1024)).toFixed(2)}{" "}
                                 MB
                              </Typography>
                              <Typography
                                 variant="body2"
                                 className="text-gray-600"
                              >
                                 Type: {file.type}
                              </Typography>
                           </Box>

                           {/* Upload Progress */}
                           {uploading && (
                              <Box className="w-full max-w-md">
                                 <Box className="flex items-center justify-center mb-2">
                                    <CircularProgress
                                       size={20}
                                       className="mr-2"
                                    />
                                    <Typography variant="body2">
                                       {getStatusMessage()}
                                    </Typography>
                                 </Box>
                                 <LinearProgress
                                    variant="determinate"
                                    value={uploadProgress}
                                    className="w-full"
                                 />
                                 <Typography
                                    variant="caption"
                                    className="block text-center mt-1"
                                 >
                                    {Math.round(uploadProgress)}%
                                 </Typography>
                              </Box>
                           )}

                           {/* Action Buttons */}
                           <Box className="flex space-x-4">
                              <Button
                                 variant="contained"
                                 onClick={handleUpload}
                                 disabled={uploading}
                                 startIcon={
                                    uploading ? (
                                       <CircularProgress size={16} />
                                    ) : (
                                       <FaCloudUploadAlt />
                                    )
                                 }
                              >
                                 {uploading ? "Uploading..." : "Upload File"}
                              </Button>

                              <Button
                                 variant="outlined"
                                 onClick={() => {
                                    setFile(null);
                                    setUploadProgress(0);
                                    setUploadStatus("idle");
                                 }}
                                 disabled={uploading}
                              >
                                 Remove
                              </Button>
                           </Box>
                        </Box>
                     )}
                  </Box>
               </Box>
            </Box>

            {uploadStatus === "complete" && videoUrl && (
               <Result
                  videoUrl={videoUrl}
                  type={file?.type || ""}
                  summary={result}
               />
            )}
         </Box>
      </>
   );
};

export default Home;
