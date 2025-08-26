import WorkCard from "@/components/WorkCard";
import { works } from "@/data/work";
import { Box, Button, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { MdChevronRight, MdFilterAlt, MdSearch, MdSort } from "react-icons/md";

const SavedWork = () => {
   const [value, setValue] = useState(0);

   const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
   };

   return (
      <Box
         component="main"
         className="px-5 pt-36 pb-20 container mx-auto relative overflow-hidden"
      >
         <Box className="flex items-center justify-between gap-5 mb-6">
            <Tabs
               value={value}
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
                     className="bg-foreground text-background py-3 px-4 pl-9 rounded-lg focus:border border-primary focus:outline-2 outline-primary"
                  />
               </Box>

               <Button
                  className="bg-background border rounded-lg min-w-0 border-background3 p-2"
                  color="inherit"
               >
                  <MdFilterAlt className="text-2xl" />
               </Button>

               <Button
                  className="bg-background border rounded-lg min-w-0 border-background3 p-2 flex gap-3 items-center"
                  color="inherit"
               >
                  <MdSort className="text-2xl" />
                  Newest
                  <MdChevronRight className="rotate-90 text-base" />
               </Button>
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
