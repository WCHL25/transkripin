import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

const Main = () => {
  return (
    <Box className="flex w-full">
      <Sidebar />

      <Box className="grow basis-0 min-h-dvh rounded-l-4xl overflow-hidden shadow-card z-[1201] bg-background2">
        <Header />

        <Outlet />
      </Box>
    </Box>
  );
};

export default Main;
