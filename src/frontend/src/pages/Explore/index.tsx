import WorkCard from "@/components/WorkCard";
import { languageOptions, typeOptions } from "@/data/options";
import { works } from "@/data/work";
import { Box, Button, ListItemText, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { MdCheck, MdChevronRight, MdSearch } from "react-icons/md";

const Explore = () => {
   const [qs, setQs] = useState({
      search: "",
      type: "",
      language: "",
   });
   const [anchorTypeEl, setAnchorTypeEl] = useState<null | HTMLElement>(null);
   const [anchorLanguageEl, setAnchorLanguageEl] = useState<null | HTMLElement>(
      null
   );

   const openType = Boolean(anchorTypeEl);
   const openLanguage = Boolean(anchorLanguageEl);

   return (
      <Box
         component="main"
         className="px-5 pt-36 pb-20 container mx-auto relative overflow-hidden"
      >
         <Box className="flex flex-col gap-8">
            <Box className="flex items-center justify-center gap-2">
               <MdSearch className="text-[52px]" />
               <h1 className="text-[34px]">What do you want to search?</h1>
            </Box>

            <input
               type="text"
               className="rounded-full bg-white focus:outline outline-primary text-xl w-full px-7 py-3 max-w-[800px] mx-auto block text-background"
               placeholder="Search..."
               value={qs.search}
               onChange={(e) => setQs({ ...qs, search: e.target.value })}
            />

            <Box className="flex justify-center gap-4">
               <Button
                  className="bg-background border px-5 min-w-0 border-background3 p-2 flex gap-3 items-center rounded-full"
                  color="inherit"
                  onClick={(e) => setAnchorTypeEl(e.currentTarget)}
               >
                  {qs.type
                     ? typeOptions.find((opt) => qs.type == opt.value)?.label
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
                  {typeOptions.map((opt) => (
                     <MenuItem
                        key={opt.label}
                        onClick={() => {
                           setQs({ ...qs, type: opt.value });
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
                                 qs.type == opt.value
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
                  {qs.language
                     ? languageOptions.find((opt) => qs.language == opt.value)
                          ?.label
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
                           setQs({ ...qs, language: opt.value });
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
                                 qs.language == opt.value
                                    ? "opacity-100"
                                    : "opacity-0"
                              }`}
                           />
                        </Box>
                     </MenuItem>
                  ))}
               </Menu>
            </Box>

            <Box className="grid grid-cols-3 gap-4">
               {works.map((w) => (
                  <WorkCard key={w.id} work={w} isExplore />
               ))}
            </Box>
         </Box>
      </Box>
   );
};

export default Explore;
