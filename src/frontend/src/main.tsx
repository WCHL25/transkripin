import { createRoot } from "react-dom/client";
import "./index.css";
import {
  GlobalStyles,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material";
import theme from "@/configs/mui";
import { RouterProvider } from "react-router-dom";
import { router } from "@/configs/routes";
import { Suspense } from "react";
import Loading from "./components/Loading";
import { ActorProvider, AgentProvider } from "@ic-reactor/react";
import { canisterId, idlFactory } from "declarations/backend";

createRoot(document.getElementById("root")!).render(
  <StyledEngineProvider enableCssLayer>
    <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
    <ThemeProvider theme={theme}>
      <Suspense fallback={<Loading />}>
        <AgentProvider
          withLocalEnv={process.env.DFX_NETWORK !== "ic"}
          host={
            process.env.DFX_NETWORK === "ic"
              ? "https://ic0.app"
              : "http://localhost:4943"
          }
        >
          <ActorProvider canisterId={canisterId} idlFactory={idlFactory}>
            <RouterProvider router={router} />
          </ActorProvider>
        </AgentProvider>
      </Suspense>
    </ThemeProvider>
  </StyledEngineProvider>
);
