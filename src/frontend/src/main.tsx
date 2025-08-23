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

createRoot(document.getElementById("root")!).render(
  <StyledEngineProvider enableCssLayer>
    <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
    <ThemeProvider theme={theme}>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
    </ThemeProvider>
  </StyledEngineProvider>
);
