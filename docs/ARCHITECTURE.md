# Architecture & Tech Stack

## Overview

**FlexiBuilder Pro Editor** is a complex web application designed to help create, format, and manage HTML content for emails and other digital platforms. It features advanced capabilities like HTML-to-Table conversion, image extraction and optimization, and automated storage uploading.

## 🏗 Technology Stack

### Frontend

- **Framework**: [React](https://react.dev/) (v18)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **UI Component Library**: [Material UI (MUI) v5](https://mui.com/)
- **Styling**: [Emotion](https://emotion.sh/) (via MUI) + CSS Modules for specific components.
- **State Management**:
  - **Zustand**: For global store management (lightweight and flexible).
  - **React Context**: For theme and specific feature contexts.
- **Code Editor**: `@uiw/react-codemirror` for in-browser code editing.
- **Drag & Drop**: `@dnd-kit/core` for drag-and-drop interfaces.
- **Image Processing**: `piexifjs`, `react-compare-slider`.

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Purpose**:
  - Serves as a proxy to avoid CORS issues.
  - Handles file upload preparation.
  - Triggers local automation scripts.
  - Runs AI Logic (Python integration).

### Automation & Tools

- **Automation**: [Playwright](https://playwright.dev/)
- **Browser**: [Brave Browser](https://brave.com/) (controlled via CDP for automated uploads).
- **OCR**: `tesseract.js` for text recognition in images.

## 🧩 Key Architecture Patterns

### 1. The "Converter" Pattern (`src/htmlConverter`)

The application relies heavily on transforming data from one format to another (e.g., Raw HTML -> Block JSON -> MJML/Table HTML).

- **`formatter.ts`**: The core engine that parses raw HTML (often from Google Docs) and converts it into a structured internal representation.
- **`useHtmlConverterLogic`**: A massive custom hook that acts as the "Controller" for the converter UI, managing state, event handlers, and side effects.

### 2. Automation Bridge

The frontend does not upload files directly to the storage providers (which might lack public APIs or CORS headers). Instead:

1.  Frontend sends file -> Local Express Backend (`/api/storage-upload/prepare`).
2.  Backend saves file to temp.
3.  Backend spawns a child process (`node automation/run-upload.js`).
4.  Automation script connects to an open Brave instance via CDP, interacts with the storage website UI to upload the file, and returns the public URL.
5.  Backend returns URL -> Frontend.

### 3. Modular Feature Structure

The `src` folder is organized somewhat by feature, but heavily centralized around:

- **`htmlConverter`**: The main powerhouse feature.
- **`imageConverter`**: Dedicated image processing tools.
- **`emailSender`**: Email dispatch utilities.
- **`components`**: Shared UI components (Buttons, Dialogs, Inputs).

## 🔄 State Management Strategy

- **Local State (`useState`)**: Used for form inputs, toggles, and UI state specific to a single component.
- **Zustand Stores**: Used for global settings that need to persist or be accessed across the app (though usage is targeted).
- **React Context**: Used for theming (`ThemeContext`) to allow dynamic switching of styles.
