import {
   Box,
   debounce,
   IconButton,
   Skeleton,
   Tab,
   Tabs,
   Tooltip,
} from "@mui/material";
import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import exampleVideo from "@/assets/video/example.mp4";
import {
   MdChevronLeft,
   MdContentCopy,
   MdDelete,
   MdSearch,
   MdShare,
   MdClose,
} from "react-icons/md";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import ModalDelete from "./components/ModalDelete";
import ModalShare from "./components/ModalShare";
import { useBackend } from "@/hooks/useBackend";
import { UserFileArtifact } from "declarations/backend/backend.did";
import { formatRelativeTime, formatTime } from "@/utils/dateUtils";

const HighlightText = ({
   text,
   searchTerm,
}: {
   text: string;
   searchTerm: string;
}) => {
   if (!searchTerm.trim()) {
      return <span>{text}</span>;
   }

   const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
   );
   const parts = text.split(regex);

   return (
      <span>
         {parts.map((part, index) =>
            regex.test(part) ? (
               <mark
                  key={index}
                  className="bg-yellow-200 text-yellow-900 px-1 rounded"
               >
                  {part}
               </mark>
            ) : (
               <span key={index}>{part}</span>
            )
         )}
      </span>
   );
};

const Result = () => {
   const [selectedTab, setSelectedTab] = useState<"transcript" | "summary">(
      "transcript"
   );
   const [work, setWork] = useState<UserFileArtifact | null>(null);
   const [openShare, setOpenShare] = useState<boolean>(false);
   const [openDelete, setOpenDelete] = useState<boolean>(false);
   const [isCopied, setIsCopied] = useState(false);
   const [loading, setLoading] = useState(true);
   const [showSearch, setShowSearch] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");

   const location = useLocation();
   const { id } = useParams();
   const setSnackbar = useSnackbarStore((s) => s.setSnackbar);
   const searchInputRef = useRef<HTMLInputElement>(null);

   const { videoUrl } = location.state || {};
   const _videoUrl = videoUrl || exampleVideo;

   // Debounced search function
   const debouncedSetSearch = useMemo(
      () =>
         debounce((value: string) => {
            setSearchTerm(value);
         }, 300),
      []
   );

   // Filter transcript segments berdasarkan search
   const filteredSegments = useMemo(() => {
      if (!work?.artifact.transcription[0]?.segments || !searchTerm.trim()) {
         return work?.artifact.transcription[0]?.segments || [];
      }

      return work.artifact.transcription[0].segments.filter((segment) =>
         segment.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
   }, [work?.artifact.transcription, searchTerm]);

   // Handle search input change
   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      debouncedSetSearch(value);
   };

   // Clear search
   const clearSearch = () => {
      setSearchTerm("");
      if (searchInputRef.current) {
         searchInputRef.current.value = "";
      }
   };

   // Toggle search visibility
   const toggleSearch = () => {
      setShowSearch(!showSearch);
      if (!showSearch) {
         // Focus input ketika search dibuka
         setTimeout(() => {
            searchInputRef.current?.focus();
         }, 100);
      } else {
         // Clear search ketika ditutup
         clearSearch();
      }
   };

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
               ? work.artifact.summary[0]!.text
               : JSON.stringify(work.artifact.transcription[0]!.text)
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

   const handleSeekTo = (timeInSeconds: number) => {
      if (mediaRef.current) {
         mediaRef.current.currentTime = timeInSeconds;
         mediaRef.current.play().catch(console.error);
      }
   };

   const handleGetDetail = async () => {
      setLoading(true);

      try {
         const fileArtifact = await backend.get_file_artifact(id!);
         setWork(fileArtifact[0] || null);
         console.log(fileArtifact);
      } catch (error: any) {
         setSnackbar({ message: error.message });
      }

      setLoading(false);
   };

   const toggleVisibility = () => {
      if (!work) return;

      if ("Public" in work.artifact.visibility) {
         work.artifact.visibility = { Private: null };
      } else {
         work.artifact.visibility = { Public: null };
      }

      setWork({ ...work });
   };

   // const handleGetFile = async () => {
   //    const file = await backend.get_file(id!);
   //    if ("Ok" in file) {
   //       console.log(file.Ok);
   //    }
   // };

   useEffect(() => {
      if (!videoUrl) {
         // handleGetFile()
      }
   }, [videoUrl]);

   useEffect(() => {
      handleGetDetail();
   }, []);

   return (
      <Box className="px-5 pt-28 pb-20 container mx-auto">
         <ModalDelete
            open={openDelete}
            onClose={() => setOpenDelete(false)}
            data={work?.artifact || null}
         />
         <ModalShare
            open={openShare}
            onClose={() => setOpenShare(false)}
            data={work?.artifact || null}
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
                        {work?.artifact.title}
                     </h1>
                     <p className="font-bold text-foreground2">
                        {formatRelativeTime(work!.artifact.created_at)}
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

         <Box className="flex gap-5 items-start">
            <Box className="grow basis-0 rounded-lg overflow-hidden sticky top-20 self-start">
               {work?.artifact.content_type.startsWith("video") ? (
                  <video
                     ref={mediaRef as React.RefObject<HTMLVideoElement>}
                     src={exampleVideo}
                     controls
                     className="w-full rounded-xl"
                  />
               ) : work?.artifact.content_type.startsWith("audio") ? (
                  <audio
                     controls
                     ref={mediaRef as React.RefObject<HTMLAudioElement>}
                     className="w-full"
                  >
                     <source src={_videoUrl} type="audio/mp3" />
                     Your browser does not support the audio element.
                  </audio>
               ) : (
                  "This type of file is not supported"
               )}
            </Box>

            <Box className="md:max-w-[500px] grow basis-0 rounded-lg bg-background min-h-[600px]">
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
                  {/* Search Bar */}
                  <Box className="flex justify-end gap-1 items-center py-2 px-5">
                     <Box className="relative flex items-center">
                        <input
                           ref={searchInputRef}
                           type="text"
                           placeholder={`Search ${selectedTab}...`}
                           onChange={handleSearchChange}
                           className={`${
                              showSearch ? "w-48 px-3 pr-8" : "w-0 px-0"
                           } transition-all duration-300 bg-foreground text-background py-1 rounded-md focus:outline-2 outline-primary`}
                        />
                        {showSearch && searchTerm && (
                           <button
                              onClick={clearSearch}
                              className="absolute right-2 text-background hover:text-gray-300 transition-colors"
                           >
                              <MdClose className="text-sm" />
                           </button>
                        )}
                     </Box>

                     <IconButton onClick={toggleSearch}>
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

                  {/* Search Results Info */}
                  {searchTerm && (
                     <Box className="px-5 py-2 text-sm text-foreground2">
                        {selectedTab === "transcript" ? (
                           <span>
                              {filteredSegments.length} of{" "}
                              {work?.artifact.transcription[0]?.segments.length || 0}{" "}
                              segments match "{searchTerm}"
                           </span>
                        ) : (
                           <span>Searching in summary for "{searchTerm}"</span>
                        )}
                     </Box>
                  )}

                  {/* Content */}
                  {selectedTab == "summary" ? (
                     <Box className="p-5">
                        {loading ? (
                           <>
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-full"
                              />
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-full"
                              />
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-full"
                              />
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-full"
                              />
                              <Skeleton
                                 variant="text"
                                 className="text-sm/normal w-4/5"
                              />
                           </>
                        ) : (
                           <div className="text-sm leading-relaxed">
                              <HighlightText
                                 text={work?.artifact.summary[0]?.text || ""}
                                 searchTerm={searchTerm}
                              />
                           </div>
                        )}
                     </Box>
                  ) : (
                     <Box className="p-5 flex flex-col gap-6">
                        {loading
                           ? Array.from({ length: 6 }).map((_, idx) => (
                                <Box
                                   key={idx}
                                   className="flex gap-4 items-start"
                                >
                                   <Skeleton
                                      variant="text"
                                      className="text-sm/normal w-12.5"
                                   />
                                   <Box className="grow basis-0">
                                      <Skeleton
                                         variant="text"
                                         className="text-sm/normal w-full"
                                      />
                                      <Skeleton
                                         variant="text"
                                         className="text-sm/normal w-4/5"
                                      />
                                   </Box>
                                </Box>
                             ))
                           : // Show filtered segments if searching, otherwise show all
                             (searchTerm
                                ? filteredSegments
                                : work?.artifact.transcription[0]?.segments || []
                             ).map((s) => {
                                const startTime = formatTime(s.start);

                                return (
                                   <Box
                                      key={s.id}
                                      className="flex gap-4 items-start"
                                   >
                                      <Tooltip title={`Jump to ${startTime}`}>
                                         <button
                                            className="text-primary hover:underline cursor-pointer p-0 min-w-[50px] text-left"
                                            onClick={() =>
                                               handleSeekTo(s.start)
                                            }
                                         >
                                            {startTime}
                                         </button>
                                      </Tooltip>
                                      <p className="flex-1 text-sm leading-relaxed">
                                         <HighlightText
                                            text={s.text}
                                            searchTerm={searchTerm}
                                         />
                                      </p>
                                   </Box>
                                );
                             })}

                        {/* No results message */}
                        {searchTerm &&
                           filteredSegments.length === 0 &&
                           !loading && (
                              <Box className="text-center py-8 text-foreground2">
                                 <p>
                                    No transcript segments found for "
                                    {searchTerm}"
                                 </p>
                              </Box>
                           )}
                     </Box>
                  )}
               </Box>
            </Box>
         </Box>
      </Box>
   );
};

export default Result;
