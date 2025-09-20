import EmptyState from "@/components/EmptyState";
import SkeletonWorkCard from "@/components/SkeletonWorkCard";
import WorkCard from "@/components/WorkCard";
import { languageOptions, sortOptions, fileTypeOptions } from "@/data/options";
import { useBackend } from "@/hooks/useBackend";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import {
   getFileTypeFilter,
   getLanguageFilter,
   getSortFilter,
} from "@/utils/getFilter";
import {
   Badge,
   Box,
   Button,
   debounce,
   FormControlLabel,
   ListItemText,
   Menu,
   MenuItem,
   Radio,
   RadioGroup,
   Tab,
   Tabs,
} from "@mui/material";
import {
   FileArtifact,
   FileArtifactFilter,
} from "declarations/backend/backend.did";
import { useEffect, useMemo, useState } from "react";
import {
   MdCheck,
   MdChevronRight,
   MdFilterAlt,
   MdSearch,
   MdSort,
} from "react-icons/md";

const SavedWork = () => {
   const [selectedTab, setSelectedTab] = useState<"myWork" | "savedWork">(
      "myWork"
   );
   const [anchorSortEl, setAnchorSortEl] = useState<null | HTMLElement>(null);
   const [anchorFilterEl, setAnchorFilterEl] = useState<null | HTMLElement>(
      null
   );
   const [searchInput, setSearchInput] = useState("");
   const [filter, setFilter] = useState<FileArtifactFilter>({
      file_type: [],
      language: [],
      search: [],
      sort: [{ Newest: null }],
   });

   const [works, setWorks] = useState<FileArtifact[]>([]);

   const debouncedSearch = debounce((q: string) => {
      setFilter((p) => ({ ...p, search: [q] }));
   }, 500);

   const [loading, setLoading] = useState(true);

   const backend = useBackend();
   const setSnackbar = useSnackbarStore((s) => s.setSnackbar);

   const openSort = Boolean(anchorSortEl);
   const openFilter = Boolean(anchorFilterEl);

   const handleChangeTab = (
      _: React.SyntheticEvent,
      newValue: "myWork" | "savedWork"
   ) => {
      setSelectedTab(newValue);
   };

   const handleListUserFiles = async () => {
      setLoading(true);
      try {
         const listUserFiles = await backend.list_user_file_artifacts([filter]);
         setWorks(listUserFiles);
         console.log("listUserFiles", listUserFiles);
      } catch (error: any) {
         setSnackbar({ message: error.message });
      }

      setLoading(false);
   };

   const handleListSavedFiles = async () => {
      setLoading(true);
      try {
         const listSavedFiles = await backend.list_saved_file_artifacts([
            filter,
         ]);
         setWorks(listSavedFiles);
         console.log("listSavedFiles", listSavedFiles);
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

   const handleResetFilter = () => {
      setSearchInput("");
      setFilter({
         file_type: [],
         language: [],
         search: [],
         sort: filter.sort,
      });
   };

   const getEmptyStateType = () => {
      if (hasFilters) {
         return "no-results";
      }
      if (selectedTab === "myWork") {
         return "no-saved";
      }
      return "no-data";
   };

   useEffect(() => {
      switch (selectedTab) {
         case "myWork":
            handleListUserFiles();
            break;
         case "savedWork":
            handleListSavedFiles();
            break;
      }
   }, [selectedTab, filter]);

   return (
      <Box
         component="main"
         className="px-5 pt-36 pb-20 container mx-auto relative overflow-hidden"
      >
         <Box className="flex items-center justify-between gap-5 mb-6">
            <Tabs
               value={selectedTab}
               onChange={handleChangeTab}
               className="bg-background rounded-full border-background3 border overflow-hidden min-h-0"
               sx={{
                  "& .MuiTabs-indicator": {
                     height: "100%",
                     borderRadius: "999px",
                     zIndex: "0",
                  },
               }}
            >
               <Tab
                  label="My Work"
                  className="px-6 py-3 text-foreground font-semibold z-10 rounded-full min-h-0"
                  value={"myWork"}
               />
               <Tab
                  label="Bookmark"
                  className="px-6 py-3 text-foreground font-semibold z-10 rounded-full min-h-0"
                  value={"savedWork"}
               />
            </Tabs>

            <Box className="flex gap-[10px] items-center">
               <Box className="relative">
                  <MdSearch className="absolute top-1/2 -translate-y-1/2 left-2 text-gray-500 text-2xl" />
                  <input
                     type="text"
                     placeholder="Search"
                     className="bg-foreground text-background py-3 px-4 pl-9 rounded-lg focus:outline-2 outline-primary"
                     value={searchInput}
                     onChange={(e) => {
                        setSearchInput(e.target.value);
                        debouncedSearch(e.target.value);
                     }}
                  />
               </Box>

               <Badge
                  badgeContent={
                     filter.file_type.length + filter.language.length
                  }
                  color="primary"
                  overlap="circular"
               >
                  <Button
                     className="bg-background border rounded-lg min-w-0 border-background3 p-2"
                     color="inherit"
                     onClick={(e) => setAnchorFilterEl(e.currentTarget)}
                  >
                     <MdFilterAlt className="text-2xl" />
                  </Button>
               </Badge>

               <Menu
                  anchorEl={anchorFilterEl}
                  open={openFilter}
                  onClose={() => setAnchorFilterEl(null)}
                  sx={{
                     "& .MuiPaper-root": {
                        background: "var(--color-background2)",
                     },
                  }}
               >
                  <Box className="px-4 py-3 flex flex-col gap-4 w-40">
                     <Box>
                        <h5 className="text-base font-bold mb-1">Type</h5>
                        <RadioGroup
                           name="type"
                           onChange={(e) =>
                              setFilter((p) => ({
                                 ...p,
                                 file_type: getFileTypeFilter(e.target.value),
                              }))
                           }
                        >
                           {fileTypeOptions.map((opt) => (
                              <FormControlLabel
                                 key={opt.value}
                                 value={opt.value}
                                 control={<Radio size="small" />}
                                 label={opt.label}
                              />
                           ))}
                        </RadioGroup>
                     </Box>
                     <Box>
                        <h5 className="text-base font-bold mb-1">Language</h5>
                        <RadioGroup
                           name="language"
                           onChange={(e) =>
                              setFilter((p) => ({
                                 ...p,
                                 language: getLanguageFilter(e.target.value),
                              }))
                           }
                        >
                           {languageOptions.map((opt) => (
                              <FormControlLabel
                                 key={opt.value}
                                 value={opt.value}
                                 control={<Radio size="small" />}
                                 label={opt.label}
                              />
                           ))}
                        </RadioGroup>
                     </Box>
                  </Box>
               </Menu>

               <Button
                  className="bg-background border rounded-lg min-w-0 border-background3 p-2 flex gap-3 items-center"
                  color="inherit"
                  onClick={(e) => setAnchorSortEl(e.currentTarget)}
               >
                  <MdSort className="text-2xl" />
                  {filter.sort[0] &&
                     sortOptions.find((opt) => opt.value in filter.sort[0]!)
                        ?.label}
                  <MdChevronRight className="rotate-90 text-base" />
               </Button>

               <Menu
                  anchorEl={anchorSortEl}
                  open={openSort}
                  onClose={() => setAnchorSortEl(null)}
                  sx={{
                     "& .MuiPaper-root": {
                        background: "var(--color-background2)",
                     },
                  }}
               >
                  {sortOptions.map((opt) => (
                     <MenuItem
                        key={opt.label}
                        onClick={() => {
                           setFilter((p) => ({
                              ...p,
                              sort: getSortFilter(opt.value),
                           }));
                           setAnchorSortEl(null);
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
                                 filter.sort.length &&
                                 opt.value in filter.sort[0]!
                                    ? "opacity-100"
                                    : "opacity-0"
                              }`}
                           />
                        </Box>
                     </MenuItem>
                  ))}
               </Menu>
            </Box>
         </Box>

         <Box className="grid grid-cols-3 gap-4">
            {loading ? (
               Array.from({ length: 6 }).map((_, idx) => (
                  <SkeletonWorkCard key={idx} />
               ))
            ) : !works.length ? (
               <EmptyState
                  type={getEmptyStateType()}
                  searchTerm={filter.search[0]}
                  hasFilters={hasFilters}
                  onReset={handleResetFilter}
               />
            ) : (
               works.map((w) => <WorkCard key={w.file_id} work={w} />)
            )}
         </Box>
      </Box>
   );
};

export default SavedWork;
