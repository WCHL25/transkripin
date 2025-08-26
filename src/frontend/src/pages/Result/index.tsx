import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Result = () => {
   const [selectedTab, setSelectedTab] = useState<"transcript" | "summary">(
      "transcript"
   );

   const location = useLocation();
   const navigate = useNavigate()
   const { videoUrl, summary, fileType } = location.state || {};

   const handleChangeTab = (_: React.SyntheticEvent, value: any) => {
      setSelectedTab(value);
   };

   useEffect(() => {
      if (!videoUrl || !summary || !fileType) {
        navigate('/saved');
      }
   }, [videoUrl, summary, fileType]);

   return (
      <Box className="flex flex-wrap gap-4 mt-20">
         <Box className="max-md:w-full md:grow md:basis-0 rounded-lg overflow-hidden">
            {fileType?.startsWith("video") ? (
               <video src={videoUrl} controls></video>
            ) : fileType?.startsWith("audio") ? (
               <audio controls>
                  <source src={videoUrl} type="audio/mp3" />
                  Your browser does not support the audio element.
               </audio>
            ) : (
               "This type of file is not supported"
            )}
         </Box>
         <Box className="md:max-w-[500px] grow basis-0 rounded-lg bg-background2">
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

            <Box className="p-5">
               <Typography variant="h6" className="mb-4">
                  Summary
               </Typography>
               {summary}
            </Box>
         </Box>
      </Box>
   );
};

export default Result;
