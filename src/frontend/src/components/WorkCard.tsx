import { useBackend } from "@/hooks/useBackend";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import { formatRelativeTime } from "@/utils/dateUtils";
import { useAuth } from "@ic-reactor/react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { FileArtifact } from "declarations/backend/backend.did";
import { useMemo, useState } from "react";
import {
   MdAudiotrack,
   MdBookmarkBorder,
   MdLock,
   MdPublic,
   MdShare,
   MdVideocam,
} from "react-icons/md";
import { Link } from "react-router-dom";

interface Props {
   work: FileArtifact;
   isExplore?: boolean;
}

const WorkCard = ({ work, isExplore = false }: Props) => {
   const date = useMemo(() => {
      return formatRelativeTime(work.created_at);
   }, [work.created_at]);

   const { identity } = useAuth();
   const backend = useBackend();
   const setSnackbar = useSnackbarStore((s) => s.setSnackbar);

   const [loading, setLoading] = useState(false);

   const handleToggleBookmark = async () => {
      setLoading(true);
      const result = await backend.toggle_file_artifact_bookmark(work.file_id);
      setLoading(false);

      if ("Err" in result) {
         setSnackbar({
            message: result.Err,
         });
      }
   };

   return (
      <Box className="p-5 rounded-[10px] bg-background border border-background3 flex flex-col gap-5">
         <Box className="flex justify-between items-center gap-5">
            <Box className="flex items-center gap-3 grow basis-0">
               <Box className="w-12 h-12 grid place-items-center bg-background3 rounded-xl shrink-0">
                  {work.content_type.startsWith("video") ? (
                     <MdVideocam className="text-2xl" />
                  ) : (
                     <MdAudiotrack className="text-2xl" />
                  )}
               </Box>

               <Box>
                  <h5 className="mb-1 font-bold">{work.title}</h5>
                  <p className="text-foreground2">{date}</p>
               </Box>
            </Box>

            {!isExplore &&
               ("Public" in work.visibility ? (
                  <MdPublic className="text-2xl shrink-0" />
               ) : (
                  <MdLock className="text-2xl shrink-0" />
               ))}
         </Box>
         <p className="text-foreground2 max-3 overflow-hidden">
            {work.summary[0]?.text}
         </p>
         <Box className="flex justify-end gap-4 items-center">
            {isExplore &&
               (work.owner.toText() == identity?.getPrincipal().toText() ? (
                  <Tooltip title="Can't bookmark your own work">
                     <IconButton className="cursor-not-allowed">
                        <MdBookmarkBorder className="text-foreground" />
                     </IconButton>
                  </Tooltip>
               ) : (
                  <IconButton onClick={handleToggleBookmark} disabled={loading}>
                     <MdBookmarkBorder className="text-foreground" />
                  </IconButton>
               ))}
            <IconButton>
               <MdShare className="text-foreground" />
            </IconButton>
            <Link to={`/works/${work.file_id}`}>
               <Button variant="contained">View</Button>
            </Link>
         </Box>
      </Box>
   );
};

export default WorkCard;
