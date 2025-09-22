import { menu } from "@/configs/menu";
import { useBackend } from "@/hooks/useBackend";
import { useAuth } from "@ic-reactor/react";
import {
   Box,
   CircularProgress,
   Divider,
   Drawer,
   List,
   ListItem,
   ListItemButton,
   ListItemIcon,
   ListItemText,
   Typography,
} from "@mui/material";
import { useEffect } from "react";
import { MdMenu } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/img/logo_blue.svg";
import { useRecentWorkStore } from "@/store/useRecentWorkStore";

export const SIDEBAR_WIDTH = 80;
export const RECENT_SIDEBAR_WIDTH = 270;
export const FULL_SIDEBAR_WIDTH = SIDEBAR_WIDTH + RECENT_SIDEBAR_WIDTH;

interface Props {
   open: boolean;
   setOpen: (val: boolean) => void;
}

const Sidebar = ({ open, setOpen }: Props) => {
   const { pathname } = useLocation();
   const navigate = useNavigate();
   const { isAuthenticated } = useAuth();

   const backend = useBackend();
   const { reload, recentWorks, loading } = useRecentWorkStore();

   useEffect(() => {
      reload(backend);
   }, [backend]);

   return (
      <Box
         className="shrink-0 transition-all"
         component="nav"
         sx={{ width: open ? FULL_SIDEBAR_WIDTH : SIDEBAR_WIDTH }}
      >
         <Drawer
            variant="permanent"
            className="transition-all"
            sx={{
               "& .MuiDrawer-paper": {
                  transitionProperty: "all",
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                  transitionDuration: "150ms",
                  boxSizing: "border-box",
                  overflow: "hidden",
                  border: 0,
                  background: "var(--color-background)",
                  width: open ? FULL_SIDEBAR_WIDTH : SIDEBAR_WIDTH,
               },
            }}
         >
            <Box className="flex h-full">
               <Box
                  className=""
                  sx={{
                     width: SIDEBAR_WIDTH,
                     paddingInline: "12px",
                     paddingBlock: "6px",
                  }}
               >
                  <List className="flex flex-col gap-5">
                     <ListItem disablePadding>
                        <ListItemButton
                           className={`py-[12px] px-[12px] rounded-[10px] flex flex-col gap-[2px] items-center mb-3`}
                           onClick={() => setOpen(!open)}
                        >
                           <ListItemIcon className="min-w-0 w-fit">
                              <MdMenu className="text-2xl text-foreground" />
                           </ListItemIcon>
                        </ListItemButton>
                     </ListItem>

                     {menu.map((m) => {
                        const isActive =
                           m.link == "/"
                              ? pathname == m.link
                              : pathname.startsWith(m.link);
                        return (
                           ((m.isProtected && isAuthenticated) ||
                              !m.isProtected) && (
                              <ListItem key={m.label} disablePadding>
                                 <ListItemButton
                                    className={`py-[6px] px-[12px] rounded-[10px] flex flex-col gap-[2px] items-center ${
                                       isActive ? "bg-primary/5" : ""
                                    }`}
                                    onClick={() => navigate(m.link)}
                                    title={m.label}
                                 >
                                    <ListItemIcon className="min-w-0 w-fit">
                                       <m.icon
                                          className={`text-2xl ${
                                             isActive
                                                ? "text-primary"
                                                : "text-foreground2"
                                          }`}
                                       />
                                    </ListItemIcon>
                                    <ListItemText
                                       primary={m.label}
                                       sx={{
                                          margin: 0,
                                          "& .MuiTypography-root": {
                                             color: isActive
                                                ? "var(--color-primary)"
                                                : "var(--color-foreground2)",
                                             fontSize: "11px",
                                             fontWeight: "bold",
                                          },
                                       }}
                                    />
                                 </ListItemButton>
                              </ListItem>
                           )
                        );
                     })}
                  </List>
               </Box>

               {open && (
                  <Divider
                     orientation="vertical"
                     flexItem
                     sx={{ backgroundColor: "#111426" }}
                  />
               )}

               <Box className="overflow-hidden px-3 py-5 grow basis-0">
                  <Box className="flex items-center gap-2 mb-8">
                     <img src={logo} alt="Transkripin logo" className="w-10" />

                     <span className="font-bold text-lg">Transkripin</span>
                  </Box>

                  <Typography
                     variant="h6"
                     className="text-sm/normal font-bold text-foreground2 whitespace-nowrap mb-3"
                  >
                     Recent Works
                  </Typography>
                  {loading ? (
                     <Box className="grid place-items-center w-full py-12">
                        <CircularProgress size={24} />
                     </Box>
                  ) : !recentWorks.length ? (
                     <Box className="grid place-items-center w-full py-12">
                        <Typography variant="body1" className="text-foreground2">No recent work found</Typography>
                     </Box>
                  ) : (
                     <Box className="flex flex-col gap-0.5 overflow-hidden">
                        {recentWorks.map((w) => (
                           <Link
                              to={`/works/${w.artifact.file_id}`}
                              key={w.artifact.file_id}
                              className="px-3 py-2.5 rounded-md bg-background hover:bg-background2 transition-colors overflow-hidden"
                           >
                              <Typography className="truncate">
                                 {w.artifact.title}
                              </Typography>
                           </Link>
                        ))}
                     </Box>
                  )}
               </Box>
            </Box>
         </Drawer>
      </Box>
   );
};

export default Sidebar;
