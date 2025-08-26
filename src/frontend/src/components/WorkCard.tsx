import { Work } from "@/data/work";
import { Box, Button, IconButton } from "@mui/material";
import { MdAudiotrack, MdBookmarkBorder, MdPublic, MdShare, MdVideocam } from "react-icons/md";
import { Link } from "react-router-dom";

interface Props {
   work: Work;
   isExplore?: boolean
}

const WorkCard = ({ work, isExplore = false }: Props) => {
   return (
      <Box className="p-5 rounded-[10px] bg-background border border-background3 flex flex-col gap-5">
         <Box className="flex justify-between items-center gap-2">
            <Box className="flex items-center gap-3">
               <Box className="w-12 h-12 grid place-items-center bg-background3 rounded-xl">
                  {work.type == "video" ? (
                     <MdVideocam className="text-2xl" />
                  ) : (
                     <MdAudiotrack className="text-2xl" />
                  )}
               </Box>

               <Box>
                  <h5 className="mb-1 font-bold">{work.title}</h5>
                  <p className="text-foreground2">{work.date}</p>
               </Box>
            </Box>

            {!isExplore && <MdPublic className="text-2xl" />}
         </Box>
         <p className="text-foreground2">{work.description}</p>
         <Box className="flex justify-end gap-4 items-center">
            {isExplore && <IconButton>
               <MdBookmarkBorder className="text-foreground" />
            </IconButton>}
            <IconButton>
               <MdShare className="text-foreground" />
            </IconButton>
            <Button variant="contained"><Link to={`/saved/${work.id}`}>View</Link></Button>
         </Box>
      </Box>
   );
};

export default WorkCard;
