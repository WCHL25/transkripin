import { Box, IconButton, Tab, Tabs, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import exampleVideo from "@/assets/video/example.mp4";
import {
   MdChevronLeft,
   MdContentCopy,
   MdDelete,
   MdSearch,
   MdShare,
} from "react-icons/md";
import { useDebouncedCallback } from "use-debounce";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import ModalDelete from "./components/ModalDelete";
import { Work } from "@/data/work";
import ModalShare from "./components/ModalShare";

interface Transcript {
   second: string;
   text: string;
}

const dummyTranscript: Transcript[] = [
   {
      second: "00:07",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
   },
   {
      second: "00:25",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
   },
];

const dummySummary =
   "Lorem ipsum dolor sit amet consectetur adipisicing elit. Asperiores reprehenderit deserunt vel dolore laudantium incidunt, odit quia in eveniet ratione ipsum iste molestias culpa odio a aut! Praesentium, voluptate reprehenderit.";

const Result = () => {
   const [selectedTab, setSelectedTab] = useState<"transcript" | "summary">(
      "transcript"
   );
   const [openShare, setOpenShare] = useState<Work | null>(null);
   const [openDelete, setOpenDelete] = useState<Work | null>(null);
   const [isCopied, setIsCopied] = useState(false);

   const location = useLocation();
   const setSnackbar = useSnackbarStore((s) => s.setSnackbar);

   const { videoUrl, fileType, summary, transcript, title } =
      location.state || {};

   const _videoUrl = videoUrl || exampleVideo;
   const _title = title || "Pembahasan AI";
   const _summary = summary || dummySummary;
   const _transcript = transcript || dummyTranscript;
   const _fileType = fileType || "video";

   const handleChangeTab = (_: React.SyntheticEvent, value: any) => {
      setSelectedTab(value);
   };

   const debounced = useDebouncedCallback(() => {
      setIsCopied(false);
   }, 2000);

   const handleCopy = async () => {
      try {
         await navigator.clipboard.writeText(
            selectedTab == "summary" ? _summary : JSON.stringify(_transcript)
         );

         setIsCopied(true);

         debounced();
      } catch (error: any) {
         console.error(error.message);
         setSnackbar({
            message: "Tautan gagal disalin. Silahkan salin manual",
         });
      }
   };

   useEffect(() => {
      console.log(videoUrl);
      console.log(summary);
      console.log(fileType);
      if (!videoUrl || !summary || !fileType) {
         //   navigate('/saved');
      }
   }, [videoUrl, summary, fileType]);

   return (
      <Box className="px-5 pt-28 pb-20 container mx-auto">
         <ModalDelete open={openDelete} setOpen={setOpenDelete} />
         <ModalShare open={openShare} setOpen={setOpenShare} />
         <Link
            to={"/saved"}
            className="flex gap-[2px] items-center text-primary font-bold mb-5 hover:underline"
         >
            <MdChevronLeft className="text-2xl" />
            Back
         </Link>

         <Box className="mb-8 flex items-center justify-between gap-3">
            <Box>
               <h1 className="font-bold text-[22px] mb-[2px]">{_title}</h1>
               <p className=" font-bold text-foreground2 ">Just now - Today</p>
            </Box>

            <Box className="flex gap-5 items-center">
               <IconButton
                  onClick={() =>
                     setOpenShare({
                        id: 1,
                        title: _title,
                        date: "",
                        description: "",
                        type: "video",
                        visibility: "public",
                     })
                  }
               >
                  <MdShare className="text-2xl text-foreground" />
               </IconButton>
               <IconButton
                  onClick={() =>
                     setOpenDelete({
                        id: 1,
                        title: _title,
                        date: "",
                        description: "",
                        type: "video",
                        visibility: "public",
                     })
                  }
               >
                  <MdDelete className="text-2xl text-foreground" />
               </IconButton>
            </Box>
         </Box>

         <Box className="relative flex gap-5 items-stretch">
            <Box className="grow basis-0 rounded-lg overflow-hidden">
               {_fileType?.startsWith("video") ? (
                  <video
                     src={_videoUrl}
                     controls
                     className="w-full rounded-xl"
                  ></video>
               ) : _fileType?.startsWith("audio") ? (
                  <audio controls>
                     <source src={_videoUrl} type="audio/mp3" />
                     Your browser does not support the audio element.
                  </audio>
               ) : (
                  "This type of file is not supported"
               )}
            </Box>
            <Box className="md:max-w-[500px] grow basis-0 rounded-lg bg-background">
               <Box className="border-b border-background3">
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

               <Box>
                  <Box className="flex justify-end gap-1 items-center py-2 px-5">
                     <IconButton>
                        <MdSearch className="text-xl text-foreground2" />
                     </IconButton>
                     <Tooltip
                        title={
                           (!isCopied ? "Copy " : "") +
                           (selectedTab == "transcript"
                              ? "Transcript"
                              : "Summary") +
                           (isCopied ? " copied" : "")
                        }
                        open={isCopied === true ? true : undefined}
                     >
                        <IconButton onClick={handleCopy}>
                           <MdContentCopy className="text-xl text-foreground2" />
                        </IconButton>
                     </Tooltip>
                  </Box>
                  {selectedTab == "summary" ? (
                     <Box className="p-5">{_summary}</Box>
                  ) : (
                     <Box className="p-5 flex flex-col gap-6">
                        {_transcript.map((t: Transcript) => (
                           <Box
                              key={t.second}
                              className="flex gap-4 items-start"
                           >
                              <p className="text-primary hover:underline cursor-pointer">
                                 {t.second}
                              </p>
                              <p>{t.text}</p>
                           </Box>
                        ))}
                     </Box>
                  )}
               </Box>
            </Box>
         </Box>
      </Box>
   );
};

export default Result;
