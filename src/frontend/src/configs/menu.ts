import { MdFolderCopy, MdHome, MdSearch } from "react-icons/md";

export const menu = [
   {
      icon: MdHome,
      label: "Home",
      link: "/",
      isProtected: false,
   },
   {
      icon: MdFolderCopy,
      label: "Saved",
      link: "/saved",
      isProtected: true,
   },
   {
      icon: MdSearch,
      label: "Explore",
      link: "/explore",
      isProtected: false,
   },
];
