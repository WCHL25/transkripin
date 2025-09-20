import { useState } from "react";
import { MdLink, MdLock, MdOutlineContentCopy, MdPublic } from "react-icons/md";
import {
   Box,
   Button,
   debounce,
   Dialog,
   DialogActions,
   DialogContent,
   Switch,
   Tooltip,
} from "@mui/material";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import { FileArtifact } from "declarations/backend/backend.did";
import { useBackend } from "@/hooks/useBackend";

interface Props {
   open: boolean;
   onClose: () => void;
   data: FileArtifact | null;
   toggleVisibility: () => void;
}

const ModalShare = ({ open, onClose, data, toggleVisibility }: Props) => {
   const [isCopied, setIsCopied] = useState(false);
   const [loading, setLoading] = useState(false);

   const setSnackbar = useSnackbarStore((s) => s.setSnackbar);

   const debounced = debounce(() => {
      setIsCopied(false);
   }, 2000);

   const backend = useBackend();

   const handleChangeVisibility = async () => {
      toggleVisibility();
      setLoading(true);
      const result = await backend.toggle_file_artifact_visibility(
         data!.file_id
      );
      setLoading(false);
      if ("Err" in result) {
         toggleVisibility();
      }

      setLoading(false);
   };

   const handleCopy = async () => {
      try {
         await navigator.clipboard.writeText(
            `${location.origin}/works/${data?.file_id}`
         );

         setIsCopied(true);

         debounced();
      } catch (error: any) {
         console.error(error.message);
         setSnackbar({
            message: "Tautan gagal disalin. Silahkan salin manual",
         });
      }
   };

   return (
      <Dialog
         open={open}
         onClose={onClose}
         fullWidth
         maxWidth={"sm"}
         sx={{ "& .MuiPaper-root": { maxWidth: "520px" } }}
      >
         <DialogContent className="bg-background2">
            <Box className="pb-4 border-b border-background3 mb-5">
               <h1 className=" font-bold text-xl mb-1">
                  Share "{data?.title}"
               </h1>
               <p className="text-foreground2">
                  Allow anyone to view this work
               </p>
            </Box>

            <Box className="flex justify-between gap-2 items-center mb-5">
               <Box className="flex gap-2 items-center">
                  <Box className="w-8 h-8 grid place-items-center text-xl text-foreground bg-background3 rounded-lg">
                     {data && "Public" in data.visibility ? (
                        <MdPublic />
                     ) : (
                        <MdLock />
                     )}
                  </Box>

                  <Box>
                     <p className="font-semibold">
                        {data && "Public" in data.visibility
                           ? "Public"
                           : "Private"}
                     </p>
                     <p className="text-foreground2 text-xs">
                        {data && "Public" in data.visibility
                           ? "Anyone can view"
                           : "Only you can view"}
                     </p>
                  </Box>
               </Box>

               <Switch
                  checked={Boolean(data && "Public" in data.visibility)}
                  onChange={handleChangeVisibility}
                  disabled={loading}
               />
            </Box>

            <Box className="flex gap-2 items-center">
               <Box className="relative grow basis-0">
                  <MdLink className="absolute left-3 top-1/2 -translate-y-1/2 text-background" />
                  <input
                     type="text"
                     className="w-full pl-9 bg-white py-2 px-3 rounded-md text-background"
                     value={`${location.origin}/works/${data?.file_id}`}
                     disabled
                  />
               </Box>
               <Tooltip
                  title={
                     (!isCopied ? "Copy " : "") +
                     "Link" +
                     (isCopied ? " copied" : "")
                  }
                  open={
                     isCopied === true &&
                     Boolean(data && "Private" in data.visibility)
                        ? true
                        : undefined
                  }
               >
                  <Button
                     variant="outlined"
                     className="flex items-center gap-2 !px-3"
                     onClick={handleCopy}
                     disabled={Boolean(data && "Private" in data.visibility)}
                  >
                     <MdOutlineContentCopy />
                     Copy
                  </Button>
               </Tooltip>
            </Box>
         </DialogContent>

         <DialogActions className="bg-background2">
            <Button onClick={onClose} variant="contained">
               Close
            </Button>
         </DialogActions>
      </Dialog>
   );
};

export default ModalShare;
