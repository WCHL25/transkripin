import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '/index.css';
import { GlobalStyles, StyledEngineProvider, ThemeProvider } from '@mui/material';
import theme from '../configs/mui';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
