import { Box, Typography } from "@mui/material";
import logo from "@/assets/img/logo_blue.svg";

const Login = () => {
//   const login = async () => {
//     const authClient = await AuthClient.create();

//     await authClient.login({
//       identityProvider: "https://identity.ic0.app/#authorize",
//       onSuccess: async () => {
//         const identity = authClient.getIdentity();
//         const actor = createActor(canisterId, {
//           agentOptions: { identity },
//         });
//       },
//     });
//   };

  return (
    <Box className="min-h-dvh grid place-items-center py-10 px-5">
      <Box className="max-w-96 mx-auto w-full">
        <Box className="flex items-center gap-2 mb-4 px-2">
          <img src={logo} alt="Transkripin logo" className="w-14" />

          <span className="font-bold text-lg">Transkripin</span>
        </Box>
        <Box className="bg-background2 w-full p-5 rounded-xl">
          <Typography variant="h5">Enter Identity</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
