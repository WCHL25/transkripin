import { Box, Button, IconButton, Skeleton } from "@mui/material";
import { MdBookmarkBorder, MdShare } from "react-icons/md";

interface Props {
   isExplore?: boolean;
}

const SkeletonWorkCard = ({ isExplore = false }: Props) => {
   return (
      <Box className="p-5 rounded-[10px] bg-background border border-background3 flex flex-col gap-5">
         <Box className="flex justify-between items-center gap-5">
            <Box className="flex items-center gap-3 grow basis-0">
               <Skeleton variant="rounded" className="w-12 h-12 shrink-0" />

               <Box className="grow basis-0">
                  <Skeleton
                     variant="text"
                     className="text-sm/normal w-full"
                  ></Skeleton>
                  <Skeleton
                     variant="text"
                     className="text-sm/normal w-25"
                  ></Skeleton>
               </Box>
            </Box>

            {!isExplore && (
               <Skeleton variant="circular" className="w-6 h-6 shrink-0" />
            )}
         </Box>
         <p className="text-foreground2 max-3 overflow-hidden">
            <Skeleton
               variant="text"
               className="text-sm/normal w-full"
            ></Skeleton>
            <Skeleton
               variant="text"
               className="text-sm/normal w-full"
            ></Skeleton>
            <Skeleton variant="text" className="text-sm/normal w-30"></Skeleton>
         </p>
         <Box className="flex justify-end gap-4 items-center">
            {isExplore && (
               <IconButton loading>
                  <MdBookmarkBorder className="text-foreground" />
               </IconButton>
            )}
            <IconButton>
               <MdShare className="text-foreground" />
            </IconButton>
            <Button variant="contained" loading>
               View
            </Button>
         </Box>
      </Box>
   );
};

export default SkeletonWorkCard;
