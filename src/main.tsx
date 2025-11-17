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
    message.includes("extension://") ||
    message.includes("chrome-extension://") ||
    message.includes("pejdijmoenmkgeppbflobdenhhabjlaj") ||
    message.includes("ERR_FILE_NOT_FOUND") ||
    message.includes("FrameDoesNotExistError") ||
    message.includes("FrameIsBrowserFrameError") ||
    message.includes("background.js") ||
    message.includes("extensionState.js") ||
    message.includes("heuristicsRedefinitions.js") ||
    message.includes("utils.js") ||
    message.includes("Could not establish connection") ||
    message.includes("The message port closed") ||
    message.includes("Receiving end does not exist") ||
    message.includes("about:srcdoc") ||
    message.includes("sandboxed") ||
    message.includes("allow-scripts") ||
    message.includes("Blocked script execution")
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
    message.includes("extension://") ||
    message.includes("FrameDoesNotExistError") ||
    message.includes("FrameIsBrowserFrameError") ||
    message.includes("background.js") ||
    message.includes("Could not establish connection") ||
    message.includes("The message port closed") ||
    message.includes("about:srcdoc") ||
    message.includes("sandboxed") ||
    message.includes("Blocked script execution")
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
    event.filename?.includes("chrome-extension://") ||
    event.filename?.includes("pejdijmoenmkgeppbflobdenhhabjlaj") ||
    event.filename?.includes("background.js") ||
    event.filename?.includes("extensionState.js") ||
    event.filename?.includes("heuristicsRedefinitions.js") ||
    event.filename?.includes("utils.js") ||
    event.message?.includes("_controlUniqueID") ||
    event.message?.includes("FormMetadata") ||
    event.message?.includes("ERR_FILE_NOT_FOUND") ||
    event.message?.includes("FrameDoesNotExistError") ||
    event.message?.includes("FrameIsBrowserFrameError") ||
    event.message?.includes("about:srcdoc") ||
    event.message?.includes("sandboxed") ||
    event.message?.includes("Blocked script execution") ||
    event.filename?.includes("about:srcdoc")
  ) {
    event.preventDefault();
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  // Ignore promise rejections from browser extensions
  const message = event.reason?.message || String(event.reason);
  if (
    message.includes("_controlUniqueID") ||
    message.includes("FormMetadata") ||
    message.includes("FrameDoesNotExistError") ||
    message.includes("FrameIsBrowserFrameError") ||
    message.includes("Could not establish connection") ||
    message.includes("The message port closed") ||
    message.includes("Receiving end does not exist") ||
    message.includes("about:srcdoc") ||
    message.includes("sandboxed") ||
    message.includes("Blocked script execution")
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
