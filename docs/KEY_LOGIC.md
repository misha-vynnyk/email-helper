# Key Logic & Workflows

This document details the complex logic within the FlexiBuilder Pro Editor, focusing on the HTML Converter and Automation features.

## 🔄 HTML Transformation Pipeline

The core function of this app is converting raw HTML (often pasted from Google Docs) into structured, email-ready HTML and MJML.

**Flow:**
`Input Editor (ContentEditable)` -> `useHtmlConverterLogic` -> `formatter.ts` -> `Output Textareas`

### 1. The Controller: `useHtmlConverterLogic`

Located in `src/htmlConverter/hooks/useHtmlConverterLogic.ts`.
This hook is the central brain of the converter panel.

- **Input Handling**: Listens for `paste` events to sanitize incoming HTML (e.g., handling base64 images).
- **State Management**: Tracks `fileName`, `log` (console output), `uploadedUrlMap` (local file paths -> public URLs).
- **Export Actions**: Exposes `handleExportHTML` and `handleExportMJML` which call the formatter functions.
- **URL Replacement**: Handles the post-upload step where local image paths in the generated code are swapped for public storage URLs.

### 2. The Engine: `formatter.ts`

Located in `src/htmlConverter/formatter.ts`.
This file contains the regex-based transformation logic. It does **not** parse HTML into a DOM tree for everything; instead, it relies heavily on Regex to find patterns and replace them with templates.

**Key Steps (`formatHtml` / `formatMjml`):**

1.  **Cleanup**: Merges similar tags, sanitizes styles, handles "italic links" logic.
2.  **Style Processing**: Converts `<span>` with specific styles (bold, italic, underline) into semantic tags (`<b>`, `<em>`, `<u>`).
3.  **Block Wrappers**: Detects specific elements (like `<h1>`, centers text) and wraps them in table-based structure using templates from `templates.ts`.
4.  **Image Wrapping**: Wraps `<img>` tags in table cells/rows.
5.  **Custom Shortcodes**: Handles custom markers like `i-r-s ... i-r-s-e` (Right Side Image) or `ftr-s ... ftr-e` (Footer) to inject complex layouts.

### 3. Templates (`templates.ts`)

Contains the raw HTML/MJML strings used for wrapping content. For example, `htmlTemplates.headline` returns a `<tr><td><h1>...</h1></td></tr>` structure customized for email clients.

## ☁️ Storage Upload Automation

The app allows uploading images to specific storage providers (like `5th-elementagency.com` or `alphaonest.com`). Since these providers often lack public APIs, the app uses a **browser automation** approach.

**Workflow:**

1.  **User action**: Clicks "Upload" in `StorageUploadDialog`.
2.  **Frontend**: Sends file to `POST /api/storage-upload/prepare`.
3.  **Backend (`server/`)**:
    - Saves the file to a temporary system folder.
    - Spawns a child process: `node automation/run-upload.js ...`
4.  **Automation Script**:
    - Connects to a running **Brave Browser** instance via Chrome DevTools Protocol (CDP).
    - Navigates to the storage provider's upload page.
    - Fills out the form and uploads the file.
    - Scrapes the resulting Public URL.
5.  **Result**: URL is returned to the Frontend and stored in `uploadedUrlMap`.

**Key File**: `automation/scripts/upload-playwright-brave.js` (The logic for driving the browser).

## 🖼 Image Processing

Located in `src/imageConverter`.

- **Optimization**: Uses `piexifjs` for metadata and canvas for resizing/compression.
- **Comparison**: `react-compare-slider` allows users to see Original vs. Optimized quality before saving.
