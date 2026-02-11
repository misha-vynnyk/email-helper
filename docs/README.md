# FlexiBuilder Pro Editor Documentation

Welcome to the technical documentation for the **FlexiBuilder Pro Editor** (also known as Email Helper).

This folder contains detailed explanations of the project's structure, architecture, and key logic to assist in development and maintenance.

## 📚 Documentation Contents

- **[Architecture & Tech Stack](./ARCHITECTURE.md)**
  - Overview of the technology stack (React, Vite, MUI, etc.)
  - High-level architecture (Frontend, Backend, Automation)
  - Key design patterns and state management.

- **[Project Structure](./PROJECT_STRUCTURE.md)**
  - Detailed breakdown of the folders and files.
  - Where to find components, hooks, utilities, and configuration.

- **[Key Logic & Complex Workflows](./KEY_LOGIC.md)**
  - **HTML Conversion**: How `formatter.ts` and `templates.ts` transform input HTML.
  - **Storage Automation**: How the detailed Playwright + Brave automation works for uploading images.
  - **Image Processing**: Logic behind `imageConverter` and optimization.

## 🔗 Other Resources

- **[Root README](../README.md)**: General project setup and run instructions.
- **[AUTOMATION.md](../AUTOMATION.md)**: Specific guide for the Storage Upload Automation scripts.
- **[HTML_CONVERTER.md](../HTML_CONVERTER.md)**: User guide for the HTML Converter feature.

## 🚀 Quick Start for Developers

1.  **Install dependencies**:

    ```bash
    npm install
    cd server && npm install
    cd ../automation && npm install
    ```

2.  **Run Development Environment**:

    ```bash
    npm run dev
    ```

    This starts:
    - Frontend (Vite) on port 5173
    - Backend (Express) on port 3001
    - AI Server (Python) (if configured)

3.  **Run Automation** (requires Brave):
    See [AUTOMATION.md](../AUTOMATION.md) for detailed setup.
