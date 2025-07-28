import { Box } from "@mui/material";
import logo from "@/assets/img/logo_blue.svg";
import { useEffect, useState } from "react";

const MAX_SCROLL = 200;

const Header = () => {
  const [opacity, setOpacity] = useState(window.scrollY / MAX_SCROLL);

  useEffect(() => {
    const handleScroll = () => {
      setOpacity(window.scrollY / MAX_SCROLL);
    };

    document.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Box
      component="header"
      className="fixed top-0 w-full py-5 z-10"
      style={{ backgroundColor: `rgba(30,35,55,${opacity})` }}
    >
      <Box className="flex justify-between px-5 container mx-auto w-full">
        <Box className="flex items-center gap-2">
          <img src={logo} alt="Transkripin logo" className="w-10" />

          <span className="font-bold text-lg">Transkripin</span>
        </Box>

        {/* <Box>
          <Button
            variant="contained"
            className="rounded-full"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </Box> */}
      </Box>
    </Box>
  );
};

export default Header;
