import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import App from "./App.jsx";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#16a34a', // var(--primary)
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    }
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
