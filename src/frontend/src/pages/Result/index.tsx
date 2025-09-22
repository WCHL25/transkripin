import {
   Box,
   CircularProgress,
   debounce,
   IconButton,
   Skeleton,
   Tab,
   Tabs,
   Tooltip,
} from "@mui/material";
import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
   MdChevronLeft,
   MdContentCopy,
   MdDelete,
   MdSearch,
   MdShare,
   MdClose,
   MdBookmark,
   MdBookmarkBorder,
   MdRefresh,
   MdDownload,
} from "react-icons/md";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import ModalDelete from "./components/ModalDelete";
import ModalShare from "./components/ModalShare";
import { useBackend } from "@/hooks/useBackend";
import { UserFileArtifact } from "declarations/backend/backend.did";
import { formatRelativeTime, formatTime } from "@/utils/dateUtils";
import { useAuth } from "@ic-reactor/react";
import { useChunkedMedia } from "@/hooks/useChunkedMedia";

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

// Helper function to format file size
const formatFileSize = (bytes: bigint): string => {
   const size = Number(bytes);
   const units = ["B", "KB", "MB", "GB"];
   let unitIndex = 0;
   let fileSize = size;

   while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
   }

   return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
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
   const [loadingBookmark, setLoadingBookmark] = useState(false);
   const [showSearch, setShowSearch] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");
   const [localMediaUrl, setLocalMediaUrl] = useState("");

   const { identity } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();
   const { id } = useParams();
   const setSnackbar = useSnackbarStore((s) => s.setSnackbar);
   const searchInputRef = useRef<HTMLInputElement>(null);
   const backend = useBackend();

   const { videoUrl } = location.state || {};
   console.log("videoUrl", videoUrl);

   // Initialize chunked media hook
   const {
      mediaUrl,
      isLoading: isMediaLoading,
      loadingProgress,
      error: mediaError,
      totalSize,
      loadedSize,
      reset: resetMedia,
      downloadFile,
      loadCompleteFile,
   } = useChunkedMedia(work?.artifact || null, backend, {
      chunkSize: 1024 * 1024, // 1MB chunks
      preloadChunks: 5, // Load first 5MB
      autoLoad: false,
   });

   const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

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

   const debounced = useMemo(
      () =>
         debounce(() => {
            setIsCopied(false);
         }, 2000),
      []
   );

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
         if (fileArtifact.length) {
            console.log("fileArtifact", fileArtifact);
            setWork(fileArtifact[0] || null);
         } else {
            setSnackbar({
               message: "You dont have permission to open this work",
            });
            navigate("/saved");
         }
      } catch (error: any) {
         setSnackbar({ message: error.message });
      }

      setLoading(false);
   };

   const handleToggleVisibility = () => {
      if (!work) return;

      if ("Public" in work.artifact.visibility) {
         work.artifact.visibility = { Private: null };
      } else {
         work.artifact.visibility = { Public: null };
      }

      setWork({ ...work });
   };

   const handleToggleBookmark = async () => {
      if (!work) return;

      setLoadingBookmark(true);
      const result = await backend.toggle_file_artifact_bookmark(
         work.artifact.file_id
      );
      setLoadingBookmark(false);

      if ("Err" in result) {
         setSnackbar({
            message: result.Err,
         });
      }

      if ("Ok" in result) {
         work.is_bookmarked = !work.is_bookmarked;
         setWork({ ...work });
      }
   };

   const debounceUpdateTitle = useMemo(
      () =>
         debounce((title: string) => {
            backend.edit_file_artifact({
               file_id: work?.artifact.file_id || "",
               title: [title],
               summary: [],
               transcription: [],
            });
         }, 800),
      [work?.artifact.file_id]
   );

   const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!work) return;

      work.artifact.title = [e.target.value];
      setWork({
         ...work,
      });
      debounceUpdateTitle(e.target.value);
   };

   // Handle media retry
   const handleRetryMedia = () => {
      if (mediaError) {
         resetMedia();
         setTimeout(() => {
            loadCompleteFile();
         }, 100);
      }
   };

   // Handle download media
   const handleDownloadMedia = () => {
      if (mediaUrl) {
         downloadFile();
      }
   };

   useEffect(() => {
      handleGetDetail();
   }, []);

   useEffect(() => {
      if (mediaError) {
         setSnackbar({
            message: `Media loading error: ${mediaError}`,
         });
      }
   }, [mediaError]);

   useEffect(() => {
      if (videoUrl) {
         setLocalMediaUrl(videoUrl);
         console.log("removing state");
         navigate(location.pathname, { replace: true });
      }
   }, [videoUrl]);

   useEffect(() => {
      if (work && !localMediaUrl) {
         loadCompleteFile();
      }
   }, [work, localMediaUrl]);

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
            toggleVisibility={handleToggleVisibility}
         />

         <Link
            to={"/saved"}
            className="flex gap-[2px] items-center text-primary font-bold mb-5 hover:underline w-fit"
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
                     <Box className="mb-0.5 relative">
                        {work?.artifact.owner.toText() ==
                           identity?.getPrincipal().toText() && (
                           <input
                              type="text"
                              className="absolute left-0 top-1/2 -translate-y-1/2 focus:outline-none focus:border-b border-background3 font-bold text-[22px] p-0 w-full"
                              value={
                                 work?.artifact.title[0] ||
                                 work?.artifact.filename
                              }
                              onChange={handleChangeTitle}
                           />
                        )}
                        <h1
                           className={`font-bold text-[22px] ${
                              work?.artifact.owner.toText() ==
                              identity?.getPrincipal().toText()
                                 ? "invisible whitespace-pre-wrap"
                                 : ""
                           }`}
                        >
                           {work?.artifact.title[0] || work?.artifact.filename}
                        </h1>
                     </Box>
                     <p className="font-bold text-foreground2">
                        {work
                           ? formatRelativeTime(work.artifact.created_at)
                           : "-"}
                     </p>
                  </>
               )}
            </Box>

            <Box className="flex gap-2 items-center">
               {work?.artifact.owner.toText() !=
                  identity?.getPrincipal().toText() && (
                  <IconButton
                     onClick={handleToggleBookmark}
                     disabled={loadingBookmark}
                  >
                     {loadingBookmark ? (
                        <CircularProgress size={20} />
                     ) : work?.is_bookmarked ? (
                        <MdBookmark className="text-2xl text-foreground" />
                     ) : (
                        <MdBookmarkBorder className="text-2xl text-foreground" />
                     )}
                  </IconButton>
               )}
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
               {/* Media Loading State */}
               {isMediaLoading && (
                  <Box className="relative bg-background rounded-xl h-64 flex flex-col items-center justify-center">
                     <CircularProgress size={40} className="mb-4" />
                     <p className="text-sm font-medium text-gray-400 mb-2">
                        Loading media...
                     </p>
                     <Box className="w-80 bg-gray-200 rounded-full h-2">
                        <Box
                           className="bg-primary h-2 rounded-full transition-all duration-300"
                           style={{ width: `${loadingProgress}%` }}
                        />
                     </Box>
                     <p className="text-xs text-gray-500 mt-2">
                        {loadingProgress.toFixed(1)}%
                        {totalSize && loadedSize && (
                           <span className="ml-2">
                              ({formatFileSize(loadedSize)} /{" "}
                              {formatFileSize(totalSize)})
                           </span>
                        )}
                     </p>
                  </Box>
               )}

               {/* Media Error State */}
               {mediaError && !isMediaLoading && (
                  <Box className="bg-red-50 border border-red-200 rounded-xl p-6">
                     <Box className="flex items-center gap-3 text-red-800 mb-3">
                        <Box className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                           <span className="text-red-600">⚠</span>
                        </Box>
                        <Box>
                           <p className="font-medium">Failed to load media</p>
                           <p className="text-sm text-red-600">{mediaError}</p>
                        </Box>
                     </Box>
                     <Box className="flex gap-2">
                        <button
                           onClick={handleRetryMedia}
                           className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
                        >
                           <MdRefresh className="text-lg" />
                           Retry
                        </button>
                     </Box>
                  </Box>
               )}

               {/* Media Player */}
               {!isMediaLoading && !mediaError && (
                  <Box className="relative">
                     {work?.artifact.content_type.startsWith("video") ? (
                        <video
                           ref={mediaRef as React.RefObject<HTMLVideoElement>}
                           src={localMediaUrl || mediaUrl || ""}
                           controls
                           className="w-full rounded-xl"
                           onError={(e) => {
                              console.error("Video playback error:", e);
                           }}
                        />
                     ) : work?.artifact.content_type.startsWith("audio") ? (
                        <Box className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-8">
                           <Box className="flex items-center justify-center mb-4">
                              <Box className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center">
                                 <span className="text-2xl">🎵</span>
                              </Box>
                           </Box>
                           <audio
                              controls
                              ref={
                                 mediaRef as React.RefObject<HTMLAudioElement>
                              }
                              className="w-full"
                              src={localMediaUrl || mediaUrl || ""}
                              onError={(e) => {
                                 console.error("Audio playback error:", e);
                              }}
                           >
                              Your browser does not support the audio element.
                           </audio>
                           <Box className="text-center mt-4">
                              <p className="font-medium text-gray-800">
                                 {work?.artifact.title[0] ||
                                    work?.artifact.filename}
                              </p>
                              {totalSize && (
                                 <p className="text-sm text-gray-600">
                                    {formatFileSize(totalSize)}
                                 </p>
                              )}
                           </Box>
                        </Box>
                     ) : (
                        <Box className="bg-gray-100 rounded-xl p-8 text-center">
                           <p className="text-gray-600">
                              This type of file is not supported for playback
                           </p>
                           <p className="text-sm text-gray-500 mt-2">
                              Content type: {work?.artifact.content_type}
                           </p>
                           {mediaUrl && (
                              <button
                                 onClick={handleDownloadMedia}
                                 className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                              >
                                 <MdDownload />
                                 Download File
                              </button>
                           )}
                        </Box>
                     )}
                  </Box>
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
                              {work?.artifact.transcription[0]?.segments
                                 .length || 0}{" "}
                              segments match "{searchTerm}"
                           </span>
                        ) : (
                           <span>Searching in summary for "{searchTerm}"</span>
                        )}
                     </Box>
                  )}

                  <Box className="max-h-130 overflow-auto">
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
                                   : work?.artifact.transcription[0]
                                        ?.segments || []
                                ).map((s) => {
                                   const startTime = formatTime(s.start);

                                   return (
                                      <Box
                                         key={s.id}
                                         className="flex gap-4 items-start"
                                      >
                                         <Tooltip
                                            title={`Jump to ${startTime}`}
                                         >
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
      </Box>
   );
};

export default Result;
