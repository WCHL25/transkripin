import { Box, Button, Slide, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface Props {
  videoUrl: string;
  type: string;
  summary: string
}

const Result: React.FC<Props> = ({ videoUrl, type, summary }) => {
  // const [selectedTab, setSelectedTab] = useState("transcript");
  const [isHalfVisible, setIsHalfVisible] = useState(false);

  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);

  // const handleChangeTab = (_: React.SyntheticEvent, value: any) => {
  //   setSelectedTab(value);
  // };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHalfVisible(entry.intersectionRatio >= 0.5);
      },
      {
        threshold: [0.5], // Trigger jika setengah bagian elemen terlihat
      }
    );

    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current);
    }

    return () => {
      if (videoContainerRef.current) {
        observer.unobserve(videoContainerRef.current);
      }
    };
  }, []);

  return (
    <>
      <Slide in={!isHalfVisible} direction="up" mountOnEnter unmountOnExit>
        <Button
          variant="contained"
          color="success"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full z-10 transition-opacity"
          onClick={() =>
            window.scrollTo({
              top: 1000,
              behavior: "smooth",
            })
          }
        >
          See Result
        </Button>
      </Slide>

      <Box className="flex flex-wrap gap-4 mt-20">
        <Box
          className="max-md:w-full md:grow md:basis-0 rounded-lg overflow-hidden"
          ref={videoContainerRef}
        >
          {type.startsWith("video") ? (
            <video ref={videoRef} src={videoUrl} controls></video>
          ) : type.startsWith("audio") ? (
            <audio controls>
              <source src={videoUrl} type="audio/mp3" />
              Your browser does not support the audio element.
            </audio>
          ) : (
            "This type of file is not supported"
          )}
        </Box>
        <Box className="md:max-w-[500px] grow basis-0 rounded-lg bg-background2">
          {/* <Tabs
            value={selectedTab}
            onChange={handleChangeTab}
            sx={{
              "& .MuiButtonBase-root:not(.Mui-selected)": {
                color: "var(--color-foreground)",
              },
            }}
          >
            <Tab label="Transcript" value={"transcript"} />
            <Tab label="Summary" value={"summary"} />
          </Tabs> */}

          <Box className="p-5">
          <Typography variant="h6" className="mb-4">Summary</Typography>
            {summary}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Result;
