import { Box, Button } from "@mui/material";
import { MdUploadFile, MdSearch, MdFilterAltOff, MdOutlineFolderOff } from "react-icons/md";

const EmptyState = ({
   type = "no-data",
   onReset,
   onUpload,
   searchTerm = "",
   hasFilters = false,
}: {
   type?: "no-data" | "no-results" | "no-saved";
   onReset?: () => void;
   onUpload?: () => void;
   searchTerm?: string;
   hasFilters?: boolean;
}) => {
   const getEmptyStateContent = () => {
      switch (type) {
         case "no-results":
            return {
               icon: <MdSearch className="text-7xl text-foreground2 mb-4" />,
               title: searchTerm
                  ? `No results found for "${searchTerm}"`
                  : "No results found",
               description: searchTerm
                  ? "Try different keywords or check your spelling"
                  : hasFilters
                  ? "Try adjusting your filters or search terms"
                  : "No items match your current search",
               actions: (
                  <Box className="flex gap-3 justify-center">
                     {onReset && (
                        <Button
                           variant="outlined"
                           startIcon={<MdFilterAltOff />}
                           onClick={onReset}
                           className="text-primary border-primary hover:bg-primary hover:text-white"
                        >
                           Clear Filters
                        </Button>
                     )}
                  </Box>
               ),
            };

         case "no-saved":
            return {
               icon: (
                  <MdUploadFile className="text-7xl text-foreground2 mb-4" />
               ),
               title: "No saved work yet",
               description:
                  "Start by uploading your first video or audio file to create transcripts and summaries",
               actions: onUpload && (
                  <Button
                     variant="contained"
                     startIcon={<MdUploadFile />}
                     onClick={onUpload}
                     className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
                  >
                     Upload File
                  </Button>
               ),
            };

         default: // "no-data"
            return {
               icon: (
                  <MdOutlineFolderOff className="text-7xl text-foreground2 mb-4" />
               ),
               title: "No works found",
               description:
                  "There are no works to display at the moment",
            };
      }
   };

   const content = getEmptyStateContent();

   return (
      <Box className="col-span-3 flex flex-col items-center justify-center py-16 px-8 text-center">
         {content.icon}
         <h3 className="text-xl font-semibold text-foreground mb-2">
            {content.title}
         </h3>
         <p className="text-foreground2 mb-6 max-w-md leading-relaxed">
            {content.description}
         </p>
         {content.actions}
      </Box>
   );
};

export default EmptyState;