import {
  Box,
  Button,
  Snackbar,
  Typography,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import { FaCloudUploadAlt } from "react-icons/fa";
import Header from "../components/Header";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { backend } from "declarations/backend";
import { fileToChunks } from "@/utils/fileUtils";
import Result from "@/components/Result";

interface SnackbarState {
  variant: "success" | "error";
  message: string;
}

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(""); // 'idle', 'uploading', 'processing', 'complete', 'error'

  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (file: File) => {
    if (!file.type.startsWith("video") && !file.type.startsWith("audio")) {
      setSnackbar({
        variant: "error",
        message: "File type not valid. Must be a video or audio.",
      });
      return false;
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setSnackbar({
        variant: "error",
        message: "File size too large. Maximum size is 100MB.",
      });
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadStatus("uploading");
      setUploadProgress(0);

      // Convert file to chunks
      const chunks = await fileToChunks(file);
      const totalChunks = chunks.length;

      // Start upload session
      const uploadSession = await backend.start_upload({
        filename: file.name,
        content_type: file.type,
        total_size: BigInt(file.size),
        total_chunks: BigInt(totalChunks),
      });

      console.log("uploadSession", uploadSession);

      if ("Err" in uploadSession) {
        throw new Error(uploadSession.Err);
      }

      const sessionId = uploadSession.Ok;

      // Upload chunks with progress tracking
      for (let i = 0; i < chunks.length; i++) {
        const result = await backend.upload_chunk({
          session_id: sessionId,
          chunk_index: BigInt(i),
          data: chunks[i],
        });

        console.log("result", result);

        if ("Err" in result) {
          throw new Error(result.Err);
        }

        // Update progress
        const progress = ((i + 1) / totalChunks) * 70; // 70% for upload
        setUploadProgress(progress);
      }

      // Complete upload
      setUploadStatus("processing");
      setUploadProgress(80);

      const completeResult = await backend.complete_upload(sessionId);

      console.log("completeResult", completeResult);

      if ("Err" in completeResult) {
        throw new Error(completeResult.Err);
      }

      setUploadProgress(100);
      setUploadStatus("complete");

      setSnackbar({
        variant: "success",
        message: "File uploaded successfully!",
      });

      // You can handle the response here (e.g., file ID, transcription result, etc.)
      console.log("Upload completed:", completeResult.Ok);

      setVideoUrl(URL.createObjectURL(file));

      setTimeout(() => {
        window.scrollTo({
          behavior: "smooth",
          top: 1000,
        });
      }, 1000);
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setSnackbar({
        variant: "error",
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
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={Boolean(snackbar)}
        onClose={() => setSnackbar(null)}
        message={snackbar?.message}
      />

      <Header />

      <Box component="main" className="container mx-auto px-5 pb-10">
        <Box className="bg-background2 blur-[70px] absolute -top-20 rounded-full w-[1200px] h-96 left-1/2 -translate-x-1/2 -z-10"></Box>

        <Box className="min-h-dvh grid place-items-center py-20 text-center">
          <Box className="w-full">
            <Box className="max-w-[800px] mx-auto">
              <Typography
                variant="h3"
                className="font-extrabold mb-7 uppercase"
              >
                Summary & Transcript
              </Typography>
              <Typography variant="h6" className="mb-20 text-foreground/70">
                Transcribes audio/video into accurate text, summarizes it into
                clear points, and makes content searchable and shareable with
                multi-language support for greater accessibility
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
                      accept="video/*,audio/*"
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
                    <Typography variant="body2" className="text-gray-600">
                      Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      Type: {file.type}
                    </Typography>
                  </Box>

                  {/* Upload Progress */}
                  {uploading && (
                    <Box className="w-full max-w-md">
                      <Box className="flex items-center justify-center mb-2">
                        <CircularProgress size={20} className="mr-2" />
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
          <Result videoUrl={videoUrl} />
        )}
      </Box>
    </>
  );
};

export default Home;
