import { Box, Button, Slide, Tab, Tabs } from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface Props {
  videoUrl: string
}

const Result: React.FC<Props> = ({ videoUrl }) => {
  const [selectedTab, setSelectedTab] = useState("transcript");
  const [isHalfVisible, setIsHalfVisible] = useState(false);

  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);

  const handleChangeTab = (_: React.SyntheticEvent, value: any) => {
    setSelectedTab(value);
  };

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

      <Box className="flex gap-4 mt-20">
        <Box
          className="w-[900px] rounded-lg overflow-hidden"
          ref={videoContainerRef}
        >
          <video ref={videoRef} src={videoUrl} controls></video>
          <div className="shaka-controls-container"></div>
        </Box>
        <Box className="grow basis-0 rounded-lg bg-background2">
          <Tabs
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
          </Tabs>
        </Box>
      </Box>
    </>
  );
};

export default Result;
