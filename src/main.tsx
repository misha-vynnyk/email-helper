import React from "react";
import ReactDOM from "react-dom/client";

import { CssBaseline, ThemeProvider } from "@mui/material";

import App from "./App";
import theme from "./theme";

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Override console.error to filter browser extension errors
console.error = (...args) => {
  const message = args.join(" ");
  if (
    message.includes("_controlUniqueID") ||
    message.includes("FormMetadata") ||
    message.includes("content_script.js") ||
    message.includes("extension://")
  ) {
    return; // Don't log browser extension errors
  }
  originalConsoleError.apply(console, args);
};

// Override console.warn to filter browser extension warnings
console.warn = (...args) => {
  const message = args.join(" ");
  if (
    message.includes("_controlUniqueID") ||
    message.includes("FormMetadata") ||
    message.includes("content_script.js") ||
    message.includes("extension://")
  ) {
    return; // Don't log browser extension warnings
  }
  originalConsoleWarn.apply(console, args);
};

// Global error handler to catch browser extension errors
window.addEventListener("error", (event) => {
  // Ignore errors from browser extensions (content scripts)
  if (
    event.filename?.includes("content_script.js") ||
    event.filename?.includes("extension://") ||
    event.message?.includes("_controlUniqueID") ||
    event.message?.includes("FormMetadata")
  ) {
    event.preventDefault();
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  // Ignore promise rejections from browser extensions
  if (
    event.reason?.message?.includes("_controlUniqueID") ||
    event.reason?.message?.includes("FormMetadata")
  ) {
    event.preventDefault();
    return false;
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
