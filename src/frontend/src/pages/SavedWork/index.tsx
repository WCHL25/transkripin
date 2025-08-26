import WorkCard from "@/components/WorkCard";
import { languageOptions, sortOptions, typeOptions } from "@/data/options";
import { works } from "@/data/work";
import {
   Badge,
   Box,
   Button,
   FormControlLabel,
   ListItemText,
   Menu,
   MenuItem,
   Radio,
   RadioGroup,
   Tab,
   Tabs,
} from "@mui/material";
import { useState } from "react";
import {
   MdCheck,
   MdChevronRight,
   MdFilterAlt,
   MdSearch,
   MdSort,
} from "react-icons/md";

const SavedWork = () => {
   const [selectedTab, setSelectedTab] = useState(0);
   const [qs, setQs] = useState({
      search: "",
      sortBy: "updated_at",
      sort: "desc",
      type: "",
      language: "",
   });
   const [anchorSortEl, setAnchorSortEl] = useState<null | HTMLElement>(null);
   const [anchorFilterEl, setAnchorFilterEl] = useState<null | HTMLElement>(
      null
   );

   const openSort = Boolean(anchorSortEl);
   const openFilter = Boolean(anchorFilterEl);

   const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      setSelectedTab(newValue);
   };

   return (
      <Box
         component="main"
         className="px-5 pt-36 pb-20 container mx-auto relative overflow-hidden"
      >
         <Box className="flex items-center justify-between gap-5 mb-6">
            <Tabs
               value={selectedTab}
               onChange={handleChange}
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
               />
               <Tab
                  label="Saved Work"
                  className="px-6 py-3 text-foreground font-semibold z-10 rounded-full min-h-0"
               />
            </Tabs>

            <Box className="flex gap-[10px] items-center">
               <Box className="relative">
                  <MdSearch className="absolute top-1/2 -translate-y-1/2 left-2 text-gray-500 text-2xl" />
                  <input
                     type="text"
                     placeholder="Search"
                     className="bg-foreground text-background py-3 px-4 pl-9 rounded-lg focus:outline-2 outline-primary"
                     value={qs.search}
                     onChange={(e) => setQs({ ...qs, search: e.target.value })}
                  />
               </Box>

               <Badge
                  badgeContent={(qs.type ? 1 : 0) + (qs.language ? 1 : 0)}
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
                              setQs({ ...qs, type: e.target.value })
                           }
                        >
                           {typeOptions.map((opt) => (
                              <FormControlLabel
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
                              setQs({ ...qs, language: e.target.value })
                           }
                        >
                           {languageOptions.map((opt) => (
                              <FormControlLabel
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
                  {
                     sortOptions.find(
                        (opt) =>
                           qs.sort == opt.value.sort &&
                           qs.sortBy == opt.value.sortBy
                     )?.label
                  }
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
                           setQs({ ...qs, ...opt.value });
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
                                 qs.sort == opt.value.sort &&
                                 qs.sortBy == opt.value.sortBy
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
            {works.map((w) => (
               <WorkCard key={w.id} work={w} />
            ))}
         </Box>
      </Box>
   );
};

export default SavedWork;
