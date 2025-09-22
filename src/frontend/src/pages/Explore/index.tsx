import EmptyState from "@/components/EmptyState";
import SkeletonWorkCard from "@/components/SkeletonWorkCard";
import WorkCard from "@/components/WorkCard";
import { languageOptions, fileTypeOptions } from "@/data/options";
import { useBackend } from "@/hooks/useBackend";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import { getFileTypeFilter, getLanguageFilter } from "@/utils/getFilter";
import {
   Box,
   Button,
   debounce,
   ListItemText,
   Menu,
   MenuItem,
} from "@mui/material";
import {
   FileArtifactFilter,
   UserFileArtifact,
} from "declarations/backend/backend.did";
import { useEffect, useMemo, useState } from "react";
import { MdCheck, MdChevronRight, MdSearch } from "react-icons/md";
import ModalShare from "../Result/components/ModalShare";

const Explore = () => {
   const [anchorTypeEl, setAnchorTypeEl] = useState<null | HTMLElement>(null);
   const [anchorLanguageEl, setAnchorLanguageEl] = useState<null | HTMLElement>(
      null
   );

   const [openShare, setOpenShare] = useState<boolean>(false);
   const [selectedWork, setSelectedWork] = useState<number | null>(null);

   const [works, setWorks] = useState<UserFileArtifact[]>([]);
   const [loading, setLoading] = useState(true);

   const [searchInput, setSearchInput] = useState("");
   const [filter, setFilter] = useState<FileArtifactFilter>({
      file_type: [],
      language: [],
      search: [],
      sort: [{ Newest: null }],
   });

   const debouncedSearch = useMemo(
      () =>
         debounce((q: string) => {
            setFilter((p) => ({ ...p, search: [q] }));
         }, 500),
      []
   );

   const backend = useBackend();
   const setSnackbar = useSnackbarStore((s) => s.setSnackbar);

   const handleResetFilter = () => {
      setSearchInput("");
      setFilter({
         file_type: [],
         language: [],
         search: [],
         sort: filter.sort,
      });
   };

   const handleListFileArtifacts = async () => {
      setLoading(true);
      try {
         const fileArtifacts = await backend.search_file_artifacts([filter]);
         setWorks(fileArtifacts);
         console.log("fileArtifacts", fileArtifacts);
      } catch (error: any) {
         setSnackbar({ message: error.message });
      }
      setLoading(false);
   };

   const hasFilters = useMemo(
      () =>
         Boolean(
            filter.search.length ||
               filter.language.length ||
               filter.file_type.length ||
               filter.language.length
         ),
      [filter]
   );

   const getEmptyStateType = () => {
      if (hasFilters) {
         return "no-results";
      }
      return "no-data";
   };

   const handleToggleBookmark = (fileId: string) => {
      const idx = works.findIndex((w) => w.artifact.file_id == fileId);
      works[idx].is_bookmarked = !works[idx].is_bookmarked;
      setWorks([...works]);
   };

   const handleToggleVisibility = () => {
      if (selectedWork === null) return;

      const work = works[selectedWork];
      if (!work) return;

      if ("Public" in work.artifact.visibility) {
         work.artifact.visibility = { Private: null };
      } else {
         work.artifact.visibility = { Public: null };
      }

      setWorks([...works]);
   };

   const handleShare = (idx: number) => {
      setOpenShare(true);
      setSelectedWork(idx);
   };

   useEffect(() => {
      handleListFileArtifacts();
   }, [filter]);

   const openType = Boolean(anchorTypeEl);
   const openLanguage = Boolean(anchorLanguageEl);

   return (
      <Box
         component="main"
         className="px-5 pt-36 pb-20 container mx-auto relative overflow-hidden"
      >
         <ModalShare
            open={openShare}
            onClose={() => setOpenShare(false)}
            data={selectedWork !== null ? works[selectedWork]?.artifact : null}
            toggleVisibility={handleToggleVisibility}
         />

         <Box className="flex flex-col gap-8">
            <Box className="flex items-center justify-center gap-2">
               <MdSearch className="text-[52px]" />
               <h1 className="text-[34px]">What do you want to search?</h1>
            </Box>

            <input
               type="text"
               className="rounded-full bg-white focus:outline outline-primary text-xl w-full px-7 py-3 max-w-[800px] mx-auto block text-background"
               placeholder="Search..."
               value={searchInput}
               onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSearch(e.target.value);
               }}
            />

            <Box className="flex justify-center gap-4">
               <Button
                  className="bg-background border px-5 min-w-0 border-background3 p-2 flex gap-3 items-center rounded-full"
                  color="inherit"
                  onClick={(e) => setAnchorTypeEl(e.currentTarget)}
               >
                  {filter.file_type[0]
                     ? fileTypeOptions.find(
                          (opt) => opt.value in filter.file_type[0]!
                       )?.label
                     : "Type"}
                  <MdChevronRight className="rotate-90 text-base" />
               </Button>

               <Menu
                  anchorEl={anchorTypeEl}
                  open={openType}
                  onClose={() => setAnchorTypeEl(null)}
                  sx={{
                     "& .MuiPaper-root": {
                        background: "var(--color-background2)",
                     },
                  }}
               >
                  {fileTypeOptions.map((opt) => (
                     <MenuItem
                        key={opt.label}
                        onClick={() => {
                           setFilter((p) => ({
                              ...p,
                              file_type: getFileTypeFilter(opt.value),
                           }));
                           setAnchorTypeEl(null);
                        }}
                     >
                        <ListItemText
                           sx={{
                              "& .MuiTypography-root": { fontSize: "14px" },
                           }}
                        >
                           {opt.label}
                        </ListItemText>
                        <Box className="ml-5">
                           <MdCheck
                              className={`${
                                 filter.file_type.length &&
                                 opt.value in filter.file_type[0]!
                                    ? "opacity-100"
                                    : "opacity-0"
                              }`}
                           />
                        </Box>
                     </MenuItem>
                  ))}
               </Menu>

               <Button
                  className="bg-background border px-5 min-w-0 border-background3 p-2 flex gap-3 items-center rounded-full"
                  color="inherit"
                  onClick={(e) => setAnchorLanguageEl(e.currentTarget)}
               >
                  {filter.language[0]
                     ? languageOptions.find(
                          (opt) => opt.value in filter.language[0]!
                       )?.label
                     : "Language"}
                  <MdChevronRight className="rotate-90 text-base" />
               </Button>

               <Menu
                  anchorEl={anchorLanguageEl}
                  open={openLanguage}
                  onClose={() => setAnchorLanguageEl(null)}
                  sx={{
                     "& .MuiPaper-root": {
                        background: "var(--color-background2)",
                     },
                  }}
               >
                  {languageOptions.map((opt) => (
                     <MenuItem
                        key={opt.label}
                        onClick={() => {
                           setFilter((p) => ({
                              ...p,
                              language: getLanguageFilter(opt.value),
                           }));
                           setAnchorLanguageEl(null);
                        }}
                     >
                        <ListItemText
                           sx={{
                              "& .MuiTypography-root": { fontSize: "14px" },
                           }}
                        >
                           {opt.label}
                        </ListItemText>
                        <Box className="ml-5">
                           <MdCheck
                              className={`${
                                 filter.language.length &&
                                 opt.value in filter.language[0]!
                                    ? "opacity-100"
                                    : "opacity-0"
                              }`}
                           />
                        </Box>
                     </MenuItem>
                  ))}
               </Menu>
            </Box>

            <Box className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-4">
               {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                     <SkeletonWorkCard key={idx} isExplore />
                  ))
               ) : !works.length ? (
                  <EmptyState
                     type={getEmptyStateType()}
                     searchTerm={filter.search[0]}
                     hasFilters={hasFilters}
                     onReset={handleResetFilter}
                  />
               ) : (
                  works.map((w, idx) => (
                     <WorkCard
                        key={w.artifact.file_id}
                        work={w}
                        isExplore
                        onToggleBookmark={handleToggleBookmark}
                        onShare={() => handleShare(idx)}
                     />
                  ))
               )}
            </Box>
         </Box>
      </Box>
   );
};

export default Explore;
