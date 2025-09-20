import { useBackend } from "@/hooks/useBackend";
import { useSnackbarStore } from "@/store/useSnackbarStore";
import { Box, Button, Dialog, DialogContent } from "@mui/material";
import { FileArtifact } from "declarations/backend/backend.did";
import { useState } from "react";
import { FaRegTrashCan } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

interface Props {
   open: boolean;
   onClose: () => void;
   data: FileArtifact | null;
}

const ModalDelete = ({ open, onClose, data }: Props) => {
   const [loading, setLoading] = useState(false);

   const navigate = useNavigate();
   const setSnackbar = useSnackbarStore(s => s.setSnackbar)

   const backend = useBackend();

   const handleDelete = async () => {
      setLoading(true);

      const result = await backend.delete_file_artifact(data!.file_id)

      if ('Ok' in result) {
         setSnackbar({message: data!.title + ' has been deleted'})
         onClose();
         navigate("/saved");
      }

      if ('Err' in result) {
         setSnackbar({message: 'Failed to delete ' + data!.title})
      }
   };

   return (
      <Dialog open={open} onClose={() => onClose()} fullWidth maxWidth="xs">
         <DialogContent className="bg-background2">
            <FaRegTrashCan className="text-center text-red-700 text-7xl mt-5 mx-auto mb-5" />
            <h1 className="text-center font-bold text-xl mb-2">Delete Work</h1>
            <p className="text-grey text-center text-base">
               Are you sure want to delete <strong>{data?.title}</strong> work?
            </p>

            <Box className="flex gap-3 justify-center mt-7">
               <Button
                  variant="outlined"
                  type="button"
                  onClick={() => onClose()}
                  className="grow basis-0"
               >
                  Cancel
               </Button>
               <Button
                  variant="contained"
                  className="grow basis-0"
                  onClick={handleDelete}
                  loading={loading}
               >
                  Delete
               </Button>
            </Box>
         </DialogContent>
      </Dialog>
   );
};

export default ModalDelete;
