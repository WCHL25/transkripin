import { useSnackbarStore } from "@/store/useSnackbarStore";
import { Snackbar } from "@mui/material";
import { Outlet, ScrollRestoration } from "react-router-dom";

const Root = () => {
  const { snackbar, setSnackbar } = useSnackbarStore();

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={Boolean(snackbar)}
        onClose={() => setSnackbar(null)}
        message={snackbar?.message}
        autoHideDuration={5000}
      />
      <ScrollRestoration />
      <Outlet />
    </>
  );
};

export default Root;
