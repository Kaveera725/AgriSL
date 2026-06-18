// React entry point — mounts the app into #root with MUI theme and router.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import App from './App.jsx';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

const theme = createTheme({
  palette: {
    primary: { main: '#2E7D32' }, // green
    secondary: { main: '#F57F17' }, // amber
  },
  typography: {
    fontFamily: 'Roboto, "Noto Sans Sinhala", sans-serif',
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
