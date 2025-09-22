import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import theme from "@/configs/mui";
import { Box, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

const Main = () => {
   const isDownLg = useMediaQuery(theme.breakpoints.down("lg"));
   const [openSidebar, setOpenSidebar] = useState(!isDownLg);

   useEffect(() => {
      setOpenSidebar(!isDownLg)
   }, [isDownLg])

   return (
      <Box className="flex w-full">
         <Sidebar open={openSidebar} setOpen={(v) => setOpenSidebar(v)} />

         <Box className="grow basis-0 min-h-dvh rounded-l-4xl overflow-hidden shadow-xl z-[1201] bg-background2">
            <Header hideLogo={openSidebar} />

            <Outlet />
         </Box>
      </Box>
   );
};

export default Main;
