import { useState } from "react";
import { MdLink, MdOutlineContentCopy, MdPublic } from "react-icons/md";
import { RiGitRepositoryPrivateFill } from "react-icons/ri";
import {
   Box,
   Button,
   Dialog,
   DialogActions,
   DialogContent,
   Switch,
   Tooltip,
} from "@mui/material";
import { Work } from "@/data/work";
import { useDebouncedCallback } from "use-debounce";
import { useSnackbarStore } from "@/store/useSnackbarStore";

const ModalShare = ({
   open,
   setOpen,
}: {
   open: Work | null;
   setOpen: React.Dispatch<React.SetStateAction<Work | null>>;
}) => {
   const [isCopied, setIsCopied] = useState(false);

   const setSnackbar = useSnackbarStore((s) => s.setSnackbar);

   const onClose = async () => {
      setOpen(null);
   };

   const debounced = useDebouncedCallback(() => {
      setIsCopied(false);
   }, 2000);

   const handleClick = async () => {
      try {
         await navigator.clipboard.writeText(
            `${location.origin}/works/${open?.id}`
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
      <Dialog open={Boolean(open)} onClose={onClose} fullWidth maxWidth={"sm"}>
         <DialogContent className="bg-background2">
            <Box className="pb-4 border-b border-background3 mb-5">
               <h1 className=" font-bold text-xl mb-1">Share Work</h1>
               <p className="text-foreground2">Allow anyone to view this work</p>
            </Box>

            <Box className="flex justify-between gap-2 items-center mb-5">
               <Box className="flex gap-2 items-center">
                  <Box className="w-8 h-8 grid place-items-center text-xl text-foreground bg-background3 rounded-lg">
                     {open?.visibility == "public" ? (
                        <MdPublic />
                     ) : (
                        <RiGitRepositoryPrivateFill />
                     )}
                  </Box>

                  <Box>
                     <p className="font-semibold">
                        {open?.visibility == "public" ? "Public" : "Private"}
                     </p>
                     <p className="text-foreground2 text-xs">
                        {open?.visibility == "public"
                           ? "Anyone can view"
                           : "Only you can view"}
                     </p>
                  </Box>
               </Box>

               <Switch
                  checked={open?.visibility == "public"}
                  onChange={(e) =>
                     open &&
                     setOpen({
                        ...open,
                        visibility: e.target.checked ? "public" : "private",
                     })
                  }
               />
            </Box>

            <Box className="flex gap-2 items-center">
               <Box className="relative grow basis-0">
                  <MdLink className="absolute left-3 top-1/2 -translate-y-1/2 text-background" />
                  <input
                     type="text"
                     className="w-full pl-9 bg-white py-2 px-3 rounded-md text-background"
                     value={`${location.origin}/works/${open?.id}`}
                     disabled
                  />
               </Box>
               <Tooltip
                  title={
                     (!isCopied ? "Copy " : "") +
                     "Link" +
                     (isCopied ? " copied" : "")
                  }
                  open={isCopied === true ? true : undefined}
               >
                  <Button
                     variant="outlined"
                     className="flex items-center gap-2 !px-3"
                     onClick={handleClick}
                     disabled={open?.visibility != "public"}
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
