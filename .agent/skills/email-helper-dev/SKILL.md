---
name: email-helper-dev
description: comprehensive guide for developing the Email Helper (FlexiBuilder Pro) application, covering frontend, backend, AI, and automation workflows.
---

# Email Helper (FlexiBuilder Pro) Development

This skill provides the context and rules for developing features within the Email Helper project (internally `flexibuilder-pro-editor`).

## 🏗 Project Architecture

The project is a Monorepo-style application with four main pillars:

1.  **Frontend**: React Single Page Application (Vite).
2.  **Backend**: Node.js / Express server (`/server`).
3.  **AI Service**: Python-based AI processing (`/server/ai`).
4.  **Automation**: Playwright scripts for external integrations (`/automation`).

## 🛠 Technology Stack

### Frontend (`/src`)

- **Framework**: React 18, TypeScript, Vite.
- **UI Library**: MUI (Material-UI) v5.
- **Styling**: Emotion (`@emotion/react`, `@emotion/styled`) + Tailwind (optional/support).
- **State Management**: Zustand (`zustand`).
- **Routing**: React Router (implied structure).
- **Utilities**: `react-toastify` (notifications), `framer-motion` (animations), `dnd-kit` (drag & drop).
- **Editors**: CodeMirror (`@uiw/react-codemirror`) for HTML editing.

### Backend (`/server`)

- **Runtime**: Node.js >= 18.
- **Framework**: Express.js.
- **Database**: IDB (IndexedDB) client-side wrapper (`idb`), File-based storage.

### Automation (`/automation`)

- **Tool**: Playwright.
- **Browser**: Brave Browser (via CDP).
- **Capabilities**: Automated image uploading to external storage providers.

### AI (`/server/ai`)

- **Language**: Python 3.
- **Environment**: Virtual environment (`venv`).

## 📂 Directory Structure & Conventions

- `src/blocks/`: Reusable logic blocks.
- `src/components/`: Shared UI components (Atoms/Molecules).
- `src/htmlConverter/`: **Feature Module** for HTML transformation logic.
- `src/imageConverter/`: **Feature Module** for Image processing logic.
- `src/theme/`: Theme definitions (colors, typography).
- `src/utils/`: Generic helpers.
- `server/`: Backend API routes.
- `automation/`: Scripts for uploading and external automation.

## 🚀 Development Workflows

### Running the Project

The project uses `concurrently` to run all services:

- `npm run dev`: **Primary command**. Starts Frontend (Vite), Backend (Node), and AI (Python) simultaneously.
- `npm run automation:upload`: Runs the image upload automation script.

### Key Rules

1.  **Strict Typing**: Always use TypeScript interfaces/types.
2.  **Component Styling**: Prefer MUI `styled` components or `sx` prop over CSS files unless necessary for global overrides.
3.  **State**: Use Zustand for global app state (e.g., user preferences, current selection).
4.  **Automation**: Do not modify `automation/` scripts unless specifically tasked to change the upload logic.
5.  **Files**: Automation and Backend logic often rely on absolute paths or relative execution. Be careful when moving files.

## 🤖 Common Tasks

### 1. Adding a UI Component

- Create in `src/components/`.
- Use MUI components as base.
- Add stories/tests if applicable.

### 2. Modifying HTML Conversion Logic

- Look in `src/htmlConverter/`.
- Logic often involves transforming DOM nodes or Regex processing.

### 3. Debugging Uploads

- Check `AUTOMATION.md` for Brave browser setup.
- Use `npm run automation:upload` to test isolated upload logic.

### 4. Code Style

- Follow ESLint config (`.eslintrc.js`).
- Prettier is set up for formatting.

## 🔍 Contextual files

- `AUTOMATION.md`: Detailed guide on Playwright/Brave automation.
- `HTML_CONVERTER.md`: Guide on the HTML conversion engine.
