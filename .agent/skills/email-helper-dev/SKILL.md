---
name: email-helper-dev
description: comprehensive guide for developing the Email Helper (FlexiBuilder Pro) application, covering frontend, backend, AI, and automation workflows.
---

# Email Helper (FlexiBuilder Pro) Development

This skill provides the context and rules for developing features within the Email Helper project (internally `flexibuilder-pro-editor`).

## 🏗 Project Architecture

The project follows a modular, feature-based architecture. Core feature modules (like `htmlConverter` and `imageConverter`) are self-contained and use a hook-based state/logic pattern.

1.  **Frontend**: React Single Page Application (Vite).
2.  **Backend**: Node.js / Express server (`/server`).
3.  **AI Service**: Python-based AI processing (`/server/ai`).
4.  **Automation**: Playwright scripts for external integrations (`/automation`).

## 🛠 Technology Stack

### Frontend (`/src`)

- **Framework**: React 18, TypeScript, Vite.
- **Styling**: **Tailwind CSS** (Primary). MUI v5 is legacy and being phased out.
- **Icons**: **Lucide React** (Primary).
- **Architecture**: **Feature Hooks Pattern** (see below).
- **State Management**: 
  - **Feature-level**: Custom hooks with `localStorage` persistence.
  - **Global-level**: `Zustand` for cross-cutting concerns.
- **Utilities**: `framer-motion` (animations), `dnd-kit` (drag & drop), `react-toastify`.
- **Editors**: CodeMirror (`@uiw/react-codemirror`) for HTML.

### Backend (`/server`)

- **Runtime**: Node.js >= 18.
- **Framework**: Express.js.
- **Database**: IndexedDB (client-side) + File-based local storage.

## 📂 Feature Module Pattern

New features should follow the pattern established in `src/htmlConverter` and `src/imageConverter`:

### 1. Hook Composition
Each feature has a primary orchestrator hook returning `{ state, actions, settings }`:
- **`state`**: Current UI state (loading, progress, items).
- **`actions`**: Functions to modify state or perform operations.
- **`settings`**: Persistent preferences (format, quality, etc.).

### 2. Directory Structure
```
src/featureName/
├── components/          ← Pure UI components (Tailwind)
├── hooks/
│   ├── useFeatureLogic.ts    ← Orchestrator
│   ├── useFeatureSettings.ts ← Persistence
│   └── internal/            ← Sub-domain hooks (File management, Queue)
├── utils/               ← Feature-specific helpers
├── types/               ← Interfaces
└── index.ts             ← Clean exports (Panel, Types)
```

## 🚀 Key Coding Rules

1.  **Styling**: **ALWAYS prefer Tailwind CSS** over MUI or CSS-in-JS.
2.  **Components**: Use the "Thin Component" pattern. UI components should receive all logic and state via props from the orchestrator hook.
3.  **Icons**: Use `lucide-react`.
4.  **Persistence**: Use custom hooks with `localStorage` synchronization for user settings.
5.  **Strict Typing**: Maintain 100% TypeScript coverage. Avoid `any`.
6.  **Animations**: Use `framer-motion` for complex transitions or Tailwind `animate-*` for simple ones.

## 🔍 Contextual files

- `AUTOMATION.md`: Guide on Playwright/Brave automation.
- `HTML_CONVERTER.md`: Technical details of the HTML engine.
- `walkthrough.md`: Reference for recent refactoring patterns.
