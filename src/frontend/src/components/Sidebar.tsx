import { menu } from "@/configs/menu";
import { useAuth } from "@ic-reactor/react";
import {
   Box,
   Drawer,
   List,
   ListItem,
   ListItemButton,
   ListItemIcon,
   ListItemText,
} from "@mui/material";
import { MdMenu } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";

export const SIDEBAR_WIDTH = 80;

const Sidebar = () => {
   const { pathname } = useLocation();
   const navigate = useNavigate();
   const { isAuthenticated } = useAuth();

   return (
      <Box
         className="shrink-0 transition-all"
         component="nav"
         sx={{ width: SIDEBAR_WIDTH }}
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
                  paddingInline: "12px",
                  paddingBlock: "6px",
                  width: SIDEBAR_WIDTH,
               },
            }}
         >
            <List className="flex flex-col gap-5">
               <ListItem disablePadding>
                  <ListItemButton
                     className={`py-[12px] px-[12px] rounded-[10px] flex flex-col gap-[2px] items-center mb-3`}
                  >
                     <ListItemIcon className="min-w-0 w-fit">
                        <MdMenu className="text-2xl text-foreground" />
                     </ListItemIcon>
                  </ListItemButton>
               </ListItem>

               {menu.map(
                  (m) =>
                     ((m.isProtected && isAuthenticated) || !m.isProtected) && (
                        <ListItem key={m.label} disablePadding>
                           <ListItemButton
                              className={`py-[6px] px-[12px] rounded-[10px] flex flex-col gap-[2px] items-center ${
                                 pathname == m.link ? "bg-primary/5" : ""
                              }`}
                              onClick={() => navigate(m.link)}
                              title={m.label}
                           >
                              <ListItemIcon className="min-w-0 w-fit">
                                 <m.icon
                                    className={`text-2xl ${
                                       pathname == m.link
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
                                       color:
                                          pathname == m.link
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
               )}
            </List>
         </Drawer>
      </Box>
   );
};

export default Sidebar;
