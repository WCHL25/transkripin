import { Avatar, Box, Button, IconButton, Menu, MenuItem } from "@mui/material";
import logo from "@/assets/img/logo_blue.svg";
import { useEffect, useState } from "react";
import { useAuth, useUpdateCall } from "@ic-reactor/react";
import { useBackend } from "@/hooks/useBackend";
import { SIDEBAR_WIDTH } from "./Sidebar";

const MAX_SCROLL = 200;

const Header = () => {
   const [opacity, setOpacity] = useState(window.scrollY / MAX_SCROLL);
   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
   const open = Boolean(anchorEl);
   const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
   };
   const handleClose = () => {
      setAnchorEl(null);
   };

   useEffect(() => {
      const handleScroll = () => {
         setOpacity(window.scrollY / MAX_SCROLL);
      };

      document.addEventListener("scroll", handleScroll);

      return () => {
         document.removeEventListener("scroll", handleScroll);
      };
   }, []);

   const { call: loginCall } = useUpdateCall({
      functionName: "login",
      onSuccess: (result) => {
         console.log("Login call successful:", result);
      },
      onError: (err) => {
         console.error("Login call error:", err);
      },
   });

   const backend = useBackend();

   const { logout, login, isAuthenticating, isAuthenticated } = useAuth({
      onLoginSuccess: async (principal) => {
         console.log("Login successful, identity:", principal.toText() || "");

         loginCall();
      },
   });

   const handleLogin = () => {
      if (!isAuthenticating) {
         login();
      }
   };

   const handleLogout = async () => {
      if (!isAuthenticating) {
         // await logoutCall();
         const res = await backend.logout();
         console.log("Logout response:", res);
         await logout();
         handleClose();
      }
   };

   return (
      <Box
         component="header"
         className="fixed top-0 py-5 z-10"
         sx={{
            backgroundColor: `rgba(30,35,55,${opacity})`,
            left: SIDEBAR_WIDTH,
            width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
         }}
      >
         <Box className="flex justify-between px-5 container mx-auto w-full">
            <Box className="flex items-center gap-2">
               <img src={logo} alt="Transkripin logo" className="w-10" />

               <span className="font-bold text-lg">Transkripin</span>
            </Box>

            <Box>
               {!isAuthenticated ? (
                  <Button
                     variant="contained"
                     className="rounded-full px-6 py-2"
                     onClick={handleLogin}
                     loading={isAuthenticating}
                  >
                     Login
                  </Button>
               ) : (
                  <>
                     <IconButton onClick={handleClick}>
                        <Avatar className="w-12 h-12" />
                     </IconButton>
                     <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        sx={{
                           "& .MuiPaper-root":  {
                              background: 'var(--color-background2)'
                           }
                        }}
                     >
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                     </Menu>
                  </>
               )}
            </Box>
         </Box>
      </Box>
   );
};

export default Header;
