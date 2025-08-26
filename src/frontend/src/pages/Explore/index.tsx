import WorkCard from "@/components/WorkCard";
import { works } from "@/data/work";
import { Box, Button } from "@mui/material";
import { MdChevronRight, MdSearch } from "react-icons/md";

const Explore = () => {
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
            />

            <Box className="flex justify-center gap-4">
               <Button
                  className="bg-background border px-5 min-w-0 border-background3 p-2 flex gap-3 items-center rounded-full"
                  color="inherit"
               >
                  Type
                  <MdChevronRight className="rotate-90 text-base" />
               </Button>
               <Button
                  className="bg-background border px-5 min-w-0 border-background3 p-2 flex gap-3 items-center rounded-full"
                  color="inherit"
               >
                  Language
                  <MdChevronRight className="rotate-90 text-base" />
               </Button>
            </Box>

            <Box className="grid grid-cols-3 gap-4">
               {works.map((w) => (
                  <WorkCard key={w.id} work={w} showSave />
               ))}
            </Box>
         </Box>
      </Box>
   );
};

export default Explore;
