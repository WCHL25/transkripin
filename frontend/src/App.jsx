import { Box, Button, Snackbar, Typography } from "@mui/material";
import { FaPlus } from "react-icons/fa6";
import Header from "../components/Header";
import { useEffect, useRef, useState } from "react";

const App = () => {
  const [file, setFile] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!file.type.startsWith("video") && !file.type.startsWith("audio")) {
      setSnackbar({
        variant: "error",
        message: "File type not valid. Must be a video or audio.",
      });
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
    } else if (!droppedFile) {
      setFile(null);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    } else if (!selectedFile) {
      setFile(null);
    }
  };

  useEffect(() => {
    console.log(file);
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
      <Box
        component="main"
        className="min-h-dvh grid place-items-center text-center"
      >
        <Box className="w-full">
          <Box className="max-w-[800px] mx-auto">
            <Typography variant="h3" className="font-extrabold mb-7">
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
            <Button
              variant="contained"
              className="w-full h-full !rounded-[24px] !grid place-items-center"
              onClick={handleClick}
            >
              <Box>
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  onChange={handleChange}
                />
                <Box className="rounded-full p-5 bg-white mb-5 w-fit mx-auto">
                  <FaPlus className="text-4xl text-black" />
                </Box>
                <Typography variant="body1">
                  Upload or drag & drop video or audio
                </Typography>
              </Box>
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default App;
