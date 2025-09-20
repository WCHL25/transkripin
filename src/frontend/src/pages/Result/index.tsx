import {
   Box,
   debounce,
   IconButton,
   Skeleton,
   Tab,
   Tabs,
   Tooltip,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import exampleVideo from "@/assets/video/example.mp4";
import {
   MdChevronLeft,
   MdContentCopy,
   MdDelete,
   MdSearch,
   MdShare,
} from "react-icons/md";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import ModalDelete from "./components/ModalDelete";
import ModalShare from "./components/ModalShare";
import { useBackend } from "@/hooks/useBackend";
import { FileArtifact } from "declarations/backend/backend.did";
import { formatRelativeTime, formatTime } from "@/utils/dateUtils";

// interface Transcript {
//    second: string;
//    text: string;
// }

// const dummyTranscript: Transcript[] = [
//    {
//       second: "00:07",
//       text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
//    },
//    {
//       second: "00:25",
//       text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
//    },
// ];

const Result = () => {
   const [selectedTab, setSelectedTab] = useState<"transcript" | "summary">(
      "transcript"
   );
   const [work, setWork] = useState<FileArtifact | null>(null);
   const [openShare, setOpenShare] = useState<boolean>(false);
   const [openDelete, setOpenDelete] = useState<boolean>(false);
   const [isCopied, setIsCopied] = useState(false);
   const [loading, setLoading] = useState(true);

   const location = useLocation();
   const { id } = useParams();
   const setSnackbar = useSnackbarStore((s) => s.setSnackbar);

   const { videoUrl } = location.state || {};

   const _videoUrl = videoUrl || exampleVideo;

   const handleChangeTab = (
      _: React.SyntheticEvent,
      value: "transcript" | "summary"
   ) => {
      setSelectedTab(value);
   };

   const backend = useBackend();

   const debounced = debounce(() => {
      setIsCopied(false);
   }, 2000);

   const handleCopy = async () => {
      if (!work) return;

      try {
         await navigator.clipboard.writeText(
            selectedTab == "summary"
               ? work.summary[0]!.text
               : JSON.stringify(work.transcription[0]!.text)
         );

         setIsCopied(true);

         debounced();
      } catch (error: any) {
         console.error(error.message);
         setSnackbar({
            message: "Link failed to copy. Please copy manually.",
         });
      }
   };

   const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

   // Function untuk seek ke waktu tertentu
   const handleSeekTo = (timeInSeconds: number) => {
      if (mediaRef.current) {
         mediaRef.current.currentTime = timeInSeconds;
         // Auto play setelah seek (optional)
         mediaRef.current.play().catch(console.error);
      }
   };

   const handleGetDetail = async () => {
      setLoading(true);
      const fileArtifact = await backend.get_file_artifact(id!);
      setWork(fileArtifact[0] || null);
      setLoading(false);
      console.log(fileArtifact);
   };

   const toggleVisibility = () => {
      if (!work) return;

      if ("Public" in work.visibility) {
         work.visibility = { Private: null };
      } else {
         work.visibility = { Public: null };
      }

      setWork({ ...work });
   };

   useEffect(() => {
      console.log(videoUrl);
   }, [videoUrl]);

   useEffect(() => {
      handleGetDetail();
   }, []);

   return (
      <Box className="px-5 pt-28 pb-20 container mx-auto">
         <ModalDelete
            open={openDelete}
            onClose={() => setOpenDelete(false)}
            data={work}
         />
         <ModalShare
            open={openShare}
            onClose={() => setOpenShare(false)}
            data={work}
            toggleVisibility={toggleVisibility}
         />
         <Link
            to={"/saved"}
            className="flex gap-[2px] items-center text-primary font-bold mb-5 hover:underline"
         >
            <MdChevronLeft className="text-2xl" />
            Back
         </Link>

         <Box className="mb-8 flex items-center justify-between gap-3">
            <Box>
               {loading ? (
                  <>
                     <Skeleton
                        variant="text"
                        className="text-[22px]/normal mb-0.5 w-140"
                     />
                     <Skeleton
                        variant="text"
                        className="text-sm/normal mb-0.5 w-40"
                     />
                  </>
               ) : (
                  <>
                     <h1 className="font-bold text-[22px] mb-0.5">
                        {work?.title}
                     </h1>
                     <p className=" font-bold text-foreground2 ">
                        {formatRelativeTime(work!.created_at)}
                     </p>
                  </>
               )}
            </Box>

            <Box className="flex gap-5 items-center">
               <IconButton onClick={() => setOpenShare(true)}>
                  <MdShare className="text-2xl text-foreground" />
               </IconButton>
               <IconButton onClick={() => setOpenDelete(true)}>
                  <MdDelete className="text-2xl text-foreground" />
               </IconButton>
            </Box>
         </Box>

         <Box className="flex gap-5 items-stretch">
            <Box className="grow basis-0 rounded-lg overflow-hidden sticky top-20">
               {work?.content_type.startsWith("video") ? (
                  <video
                     ref={mediaRef as React.RefObject<HTMLVideoElement>}
                     src={exampleVideo}
                     controls
                     className="w-full rounded-xl"
                  ></video>
               ) : work?.content_type.startsWith("audio") ? (
                  <audio
                     controls
                     ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  >
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
                     <Box className="p-5">
                        {loading ? (
                           <>
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-full"
                              ></Skeleton>
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-full"
                              ></Skeleton>
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-full"
                              ></Skeleton>
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-full"
                              ></Skeleton>
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-4/5"
                              ></Skeleton>
                           </>
                        ) : (
                           work?.summary[0]?.text
                        )}
                     </Box>
                  ) : (
                     <Box className="p-5 flex flex-col gap-6">
                        {loading ? Array.from({length: 6}).map((_, idx) => (
                           <Box key={idx} className="flex gap-4 items-start">
                              <Skeleton variant="text" className="text-sm/normal w-16" />
                              <Box className="grow basis-0">
                                 <Skeleton variant="text" className="text-sm/normal w-full" />
                                 <Skeleton variant="text" className="text-sm/normal w-4/5" />
                              </Box>
                           </Box>
                        )) : work?.transcription[0]?.segments.map((s) => {
                           const startTime = formatTime(s.start);
                           return (
                              <Box
                                 key={s.id}
                                 className="flex gap-4 items-start"
                              >
                                 <Tooltip title={`Jump to ${startTime}`}>
                                    <p
                                       className="text-primary hover:underline cursor-pointer"
                                       onClick={() => handleSeekTo(s.start)}
                                    >
                                       {startTime}
                                    </p>
                                 </Tooltip>
                                 <p>{s.text}</p>
                              </Box>
                           );
                        })}
                     </Box>
                  )}
               </Box>
            </Box>
         </Box>
      </Box>
   );
};

export default Result;
