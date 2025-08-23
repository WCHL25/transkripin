import { Box, Button } from "@mui/material";
import logo from "@/assets/img/logo_blue.svg";
import { useEffect, useState } from "react";
import { useAuth } from "@ic-reactor/react";
import { useBackend } from "@/hooks/useBackend";

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

  // const {
  //   call: loginCall,
  // } = useUpdateCall({
  //   functionName: "login",
  //   onSuccess: (result) => {
  //     console.log("Login call successful:", result);
  //   },
  //   onError: (err) => {
  //     console.error("Login call error:", err);
  //   },
  // });

  const backend = useBackend();

  // const {
  //   call: logoutCall,
  // } = useUpdateCall({
  //   functionName: "logout",
  //   onSuccess: (result) => {
  //     console.log("Logout call successful:", result);
  //   },
  //   onError: (err) => {
  //     console.error("Logout call error:", err);
  //   },
  // });

  const { logout, login, isAuthenticating, isAuthenticated } = useAuth({
    onLoginSuccess: async (principal) => {
      console.log("Login successful, identity:", principal.toText() || "");

      // loginCall();
      const res = await backend.login();
      console.log("Login response:", res);
    },
  });

  const handleLogin = () => {
    if (!isAuthenticating) {
      login();
    }
  };

  const handleLogout =async  () => {
    if (!isAuthenticating) {
      // await logoutCall();
      const res = await backend.logout();
      console.log("Logout response:", res);
      logout();
    }
  };

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

        <Box>
          <Button
            variant="contained"
            className="rounded-full"
            onClick={() => (isAuthenticated ? handleLogout() : handleLogin())}
            loading={isAuthenticating}
          >
            {isAuthenticated ? "Logout" : "Login"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
