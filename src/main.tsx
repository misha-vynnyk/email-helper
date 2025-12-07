import React from "react";
import ReactDOM from "react-dom/client";

import { CssBaseline, ThemeProvider } from "@mui/material";

import App from "./App";
import theme from "./theme";

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Override console.error to filter browser extension errors and network errors
console.error = (...args) => {
  const message = args.join(" ");
  const firstArg = args[0];

  // Перевіряємо чи це помилка GET запиту або завантаження ресурсу
  if (typeof firstArg === 'string' && (
    firstArg.includes('GET chrome-extension://') ||
    firstArg.includes('Failed to load resource') ||
    firstArg.includes('net::ERR_FILE_NOT_FOUND') ||
    firstArg.includes('net::ERR_CONNECTION_REFUSED') ||
    firstArg.includes('chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj') ||
    firstArg.includes('storage.5th-elementagency.com')
  )) {
    return; // Don't log browser extension network errors or image loading errors
  }

  if (
    message.includes("_controlUniqueID") ||
    message.includes("FormMetadata") ||
    message.includes("content_script.js") ||
    message.includes("extension://") ||
    message.includes("chrome-extension://") ||
    message.includes("pejdijmoenmkgeppbflobdenhhabjlaj") ||
    message.includes("ERR_FILE_NOT_FOUND") ||
    message.includes("ERR_CONNECTION_REFUSED") ||
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
    message.includes("Blocked script execution") ||
    message.includes("storage.5th-elementagency.com") ||
    message.includes("Failed to load resource") ||
    message.includes("imageUrlReplacer.ts")
  ) {
    return; // Don't log browser extension errors or network errors
  }
  originalConsoleError.apply(console, args);
};

// Override console.warn to filter browser extension warnings and image cache warnings
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
    message.includes("Blocked script execution") ||
    message.includes("[ImageCache] Failed to preload image") ||
    message.includes("imageUrlReplacer.ts")
  ) {
    return; // Don't log browser extension warnings or image cache warnings
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
    event.message?.includes("ERR_CONNECTION_REFUSED") ||
    event.message?.includes("FrameDoesNotExistError") ||
    event.message?.includes("FrameIsBrowserFrameError") ||
    event.message?.includes("about:srcdoc") ||
    event.message?.includes("sandboxed") ||
    event.message?.includes("Blocked script execution") ||
    event.message?.includes("storage.5th-elementagency.com") ||
    event.filename?.includes("about:srcdoc") ||
    event.filename?.includes("imageUrlReplacer.ts")
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
