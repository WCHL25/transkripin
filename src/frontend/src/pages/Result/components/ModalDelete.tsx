import { Work } from "@/data/work";
import { Box, Button, Dialog, DialogContent } from "@mui/material";
import { useState } from "react";
import { FaRegTrashCan } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

interface Props {
   open: Work | null;
   setOpen: React.Dispatch<React.SetStateAction<Work | null>>;
}

const ModalDelete = ({ open, setOpen }: Props) => {
   const [loading, setLoading] = useState(false);

   const navigate = useNavigate()

   const handleClick = async () => {
      setLoading(true)

      setTimeout(() => {
         setLoading(false)
         setOpen(null);
         navigate('/saved');
      }, 600);
   };

   return (
      <Dialog
         open={Boolean(open)}
         onClose={() => setOpen(null)}
         fullWidth
         maxWidth="xs"
      >
         <DialogContent className="bg-background2">
            <FaRegTrashCan className="text-center text-red-700 text-7xl mt-5 mx-auto mb-5" />
            <h1 className="text-center font-bold text-xl mb-2">
               Delete Work
            </h1>
            <p className="text-grey text-center text-base">
               Are you sure want to delete <strong>{open?.title}</strong> work?
            </p>

            <Box className="flex gap-3 justify-center mt-7">
               <Button
                  variant="outlined"
                  type="button"
                  onClick={() => setOpen(null)}
                  className="grow basis-0"
               >
                  Cancel
               </Button>
               <Button
                  variant="contained"
                  className="grow basis-0"
                  onClick={handleClick}
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
