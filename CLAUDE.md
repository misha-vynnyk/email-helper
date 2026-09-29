# FlexiBuilder Pro — Knowledge Base for Claude

## Project Overview

**FlexiBuilder Pro** (repo: `email-helper-copy`) is a comprehensive email template builder application. It allows users to:
- Build and format email HTML/MJML templates
- Process and optimize images (convert formats, resize, batch)
- Send test emails via SMTP
- Manage a block library and a template library backed by the local filesystem
- Upload finished files to multiple cloud storage providers (default, alphaone, ttt)
- Validate email HTML for client compatibility
- Generate ALT text and smart image names with an AI backend

**Live demo** (UI only): https://misha-vynnyk.github.io/email-helper/

---

## Technical Wiki — always use this

A synthesized, cross-referenced knowledge base for this project — decisions, status, and audits that aren't derivable from code alone (this file covers stack/architecture; the wiki covers "why" and current status) — is maintained externally in Obsidian at `/Users/mykhailovynnyk/Documents/Obsidian/LoWiki/email-helper/`. Start at its `index.md`; maintenance rules are in the vault-level `/Users/mykhailovynnyk/Documents/Obsidian/LoWiki/CLAUDE.md`.

**This is a standing instruction, not a one-off reference:**
- Before non-trivial work in this repo, check `/Users/mykhailovynnyk/Documents/Obsidian/LoWiki/email-helper/index.md` for existing context (and `/Users/mykhailovynnyk/Documents/Obsidian/LoWiki/concepts/index.md` for general, non-project-specific principles) before re-deriving it from scratch.
- When work surfaces something worth keeping — a decision, a status change, a finding that contradicts an existing wiki page — ingest it per the vault's own `CLAUDE.md` rules as part of finishing the task, not as a separate follow-up someone has to ask for.

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| React | ^18.2.0 | UI framework |
| TypeScript | ^5.2.2 | Type safety |
| Vite | ^8.0.11 | Build tool & dev server |
| Tailwind CSS | ^3.4.19 | Styling (MUI fully removed; shadcn-style CSS variables) |
| Electron + electron-vite | ^42 | Desktop packaging (`npm run dist:mac` / `dist:win`) |
| Zustand | ^4.5.1 | State management |
| i18next | ^25.8.13 | Internationalization |
| Radix UI | various | Headless accessible components |
| Framer Motion | ^12.34.3 | Animations |
| React Toastify | ^11.0.5 | Toast notifications |
| React Window | ^2.2.5 | Virtualized lists |
| CodeMirror 6 | ^4.24.2 | In-app code editor |
| DOMPurify | ^3.2.7 | HTML sanitization |
| jsquash suite | various | Client-side image conversion (AVIF/JPEG/PNG/WebP) |
| Tesseract.js | ^6.0.1 | Browser-side OCR |
| jszip | ^3.10.1 | ZIP file creation |
| dnd-kit | ^6.3.1 | Drag-and-drop |
| piexifjs | ^1.0.6 | EXIF data handling |
| uuid | ^14.0.0 | Unique IDs |
| zod | ^3.22.4 | Schema validation (env vars) |

### Backend (Node.js)
| Tool | Purpose |
|------|---------|
| Express | ^4.18.2 HTTP API |
| TypeScript | ^5.3.3 type safety |
| Nodemailer | ^7.0.9 SMTP email sending |
| Sharp | ^0.33.0 server-side image processing |
| Multer | file upload middleware |
| Gifsicle | ^5.3.0 GIF optimization |
| Helmet | security headers |
| CORS | cross-origin support |
| express-rate-limit | rate limiting |

### AI Integration (`server/routes/aiProxy.js` for Ollama; `cloudflare-worker/` + client-side code for Cloudflare — two independent paths, see full write-up below)
| Tool | Purpose |
|------|---------|
| Ollama (local, external process) | Ollama provider — runs the vision-capable model (default `qwen2.5vl`, configurable); via the local Node backend |
| Cloudflare Workers AI (free tier) | Cloudflare provider — cloud vision models for machines too weak to run Ollama locally; client-side only, via a public Worker (zero-config) or own account token |

No separate Python/FastAPI service — the old `server/ai/` microservice (FastAPI + PaddleOCR + CLIP + Gemma 3) was removed and replaced by a single Express route that proxies image bytes straight to a local Ollama instance's `/api/generate` and parses its JSON response. See the full write-up under "AI Integration" below.

### Automation
| Tool | Purpose |
|------|---------|
| Playwright Core | Browser automation (Brave CDP) |
| Concurrently | Running multiple dev processes |
| Nodemon | Backend hot-reload |

---

## Directory Structure

```
email-helper-copy/
├── src/                        # React frontend source
│   ├── App/                    # Root app + layout
│   ├── blocks/                 # TypeScript email block definitions
│   ├── blockLibrary/           # Block library UI & logic
│   ├── templateLibrary/        # Template library UI & logic
│   ├── htmlConverter/          # HTML/MJML converter (main feature)
│   │   └── advanced/           # DOM-based GDocs→email pipeline (IR + classify + render)
│   ├── imageConverter/         # Image format conversion tool
│   ├── emailSender/            # Email sending functionality
│   ├── emailValidator/         # Email HTML validation
│   ├── components/             # Shared UI components
│   ├── hooks/                  # Shared custom hooks
│   ├── api/                    # HTTP client & endpoint definitions
│   ├── contexts/               # Zustand global state
│   ├── config/                 # API URL, env validation, feature flags
│   ├── theme/                  # MUI theme + dark/light mode
│   ├── utils/                  # Utility functions
│   ├── lib/                    # Shared libs (clsx/cn helper)
│   ├── types/                  # Global TypeScript types
│   ├── main.tsx                # React entry point
│   └── i18n.ts                 # i18next configuration
├── server/                     # Node.js Express backend
│   ├── index.js                # Entry point (port 3001)
│   ├── routes/                 # API route handlers
│   ├── blockFileManager.ts     # Block CRUD + filesystem watcher
│   ├── templateManager.ts      # Template CRUD + filesystem watcher
│   ├── pathValidator.ts        # Path security validation
│   ├── workspaceManager.ts     # Workspace/project management
│   ├── utils/                  # htmlSanitizer, storagePathResolver, gifOptimizer
│   ├── routes/aiProxy.js       # Ollama image-analysis proxy (/ai-api) — delegates to aiProviders/
│   ├── aiProviders/            # ollamaProvider.js, shared.js (prompt/resize/JSON-extract) — shared with the Cloudflare Worker in spirit (worker.js keeps its own copy, see cloudflare-worker/)
│   └── ollama-settings.json    # Persisted Ollama host/model/prompt settings
├── cloudflare-worker/          # Independent Cloudflare Workers AI deploy — see its own README.md
│   ├── src/worker.js           # Zero-config shared mode + own-token relay mode, same endpoint
│   └── wrangler.toml
├── automation/                 # Playwright browser automation
│   ├── config.json             # Browser profiles & storage provider config
│   ├── run-upload.js           # CLI entry point
│   ├── setup.js                # Auto-configure Brave path
│   ├── setup_all.js            # postinstall hook
│   └── scripts/
│       └── upload-playwright-brave.js  # Main upload logic
├── scripts/                    # Build & dev scripts
│   ├── dev-runner.js           # Orchestrates dev services (Vite + backend + dashboard)
│   ├── print-dashboard.js      # Print dev URLs
│   └── ensure-node.js          # Node version check
├── public/                     # Static assets
├── vite.config.ts              # Vite config (proxy, alias, ports)
├── tsconfig.json               # TypeScript config
├── jest.config.js              # Jest test config
├── tailwind.config.js          # Tailwind config
├── automation/config.json      # Storage providers config
├── .env.example                # Environment variables template
├── README.md                   # Ukrainian project docs
├── TEAM_GUIDE.md                # Per-tab usage guide (supersedes the old AUTOMATION.md/HTML_CONVERTER.md)
└── archive/                    # Superseded/historical docs, kept for reference
```

---

## Frontend Architecture

### Entry Points

**`src/main.tsx`** — React root, wraps app with `ThemeProvider`, filters console noise.

**`src/App/index.tsx`** — Root component:
- ErrorBoundary (ignores browser extension errors)
- `SplashLoader` shown while checking server health (`useServerHealthCheck`)
- Renders `SamplesDrawer` + `TemplatePanel` + modal overlays
- Manages `registrationOpen`, `settingsMenuOpen` state

**`src/App/TemplatePanel/index.tsx`** — Main content area:
- 5 tabs: `email | blocks | templates | images | converter`
- Lazy-mounts tab content on first access
- Uses `useDeferredValue` for smooth transitions

### Routing

No React Router — tab-based navigation:
| Tab | Component | Purpose |
|-----|-----------|---------|
| `email` | `EmailSenderPanel` | Send test emails via SMTP |
| `blocks` | `BlockLibrary` | Browse/manage email blocks (hidden in v1.0, see feature flags) |
| `templates` | `TemplateLibrary` | Browse/manage email templates |
| `images` | `ImageConverterPanel` | Convert image formats |
| `converter` | `HtmlConverterPanel` | Main HTML/MJML editor & formatter |

**Feature flags** (`src/config/featureFlags.ts`, build-time): `BLOCK_LIBRARY_ENABLED = false` (Blocks tab hidden for v1.0), `EMAIL_VALIDATOR_ENABLED = false` (validator panel hidden for v1.0).

### State Management (Zustand)

**`src/contexts/AppState.tsx`** — Global store:

| State | Hook | Type |
|-------|------|------|
| `selectedMainTab` | `useSelectedMainTab()` | `"email" \| "blocks" \| "templates" \| "images" \| "converter"` |
| `samplesDrawerOpen` | `useSamplesDrawerOpen()` | `boolean` |
| setter | `setSelectedMainTab()` | Function (persists to localStorage) |
| setter | `toggleSamplesDrawerOpen()` | Function |

### Context Providers

- **`ThemeContext`** (`src/theme/ThemeContext.tsx`) — dark/light mode + theme style
- **`EmailSenderContext`** (`src/emailSender/EmailSenderContext.tsx`) — email credentials + server state

---

## Core Feature Modules

### A. HTML Converter (`src/htmlConverter/`)

The most complex feature. Converts plain text/raw HTML to formatted email-safe HTML and MJML.

**Key files:**
- `HtmlConverterPanel.tsx` — Main UI
- `formatter.ts` — HTML/MJML generation logic
- `templates.ts` — Template library (with/without footer variants)
- `constants.ts` — Storage URLs, configs
- `types.ts` — Module-specific types

**Sub-components (`components/` — 21 files):**
- `Header.tsx` — Top controls
- `ExportPanel.tsx` — Export HTML/MJML/ZIP
- `FileNamingBar.tsx` — Filename input with AI suggestions
- `StorageUploadDialog.tsx` — Upload to storage providers
- `UploadHistory.tsx` — Session upload history
- `ImageGrid.tsx` — Image grid display
- `DiagnosticsPanel.tsx` — Debug info

**Custom hooks (`hooks/` — 10 files):**
| Hook | Purpose |
|------|---------|
| `useHtmlConverterLogic.ts` | Main business logic |
| `useHtmlConverterSettings.ts` | Settings persistence |
| `useImageConversion.ts` | Image processing |
| `useImageUploader.ts` | Upload orchestration |
| `useOcrAnalysis.ts` | OCR + AI analysis |
| `useAiLogger.ts` | AI backend logging |

**Storage providers (subdirs):**
- `ttt/` — TTT (TerraTrans) provider config
- `alphaone/` — AlfaOne provider config

**Advanced converter (`advanced/`)** — DOM-based pipeline for raw GDocs paste (spec: `ADVANCED_HTML_CONVERTER.md`):
- Pipeline: `preprocess → normalize → fromDom (structural IR) → classify (semantic IR) → render`
- All visuals come from `config/tokens.ts`; profiles (`profiles/ttt.ts`, `alphaone.ts`) are token overrides — no markup forks
- `convertAdvancedDetailed()` returns `{ html, warnings }`; warnings surface in the UI log
- Inline links intentionally render `href="urlhere"` (placeholder workflow); images never carry the source doc's own `src`/`alt` either — every `<img>` renders `tok.placeholderImageSrc`/`placeholderImageAlt` (per-provider storage root URL + `"Video preview"`, matching the Simple converter's `wrapImg` convention), replaced later by the app's own upload flow
- Optional DOMPurify pass in `sanitize.ts` for untrusted input

**Features:**
- Convert plain text → email-safe HTML
- Generate MJML from HTML
- Format HTML with predefined templates
- Extract images → download links
- Auto-format links, lists, structure
- Replace image URLs with template variables
- Export as HTML, MJML, or ZIP

---

### B. Image Converter (`src/imageConverter/`)

Client-side image format conversion — no server needed.

**Architecture:**
- `components/` (16 files) — UI
- `hooks/` (6 files) — state & logic
- `utils/` (11 files) — image utilities
- `workers/` — Web Workers for non-blocking conversion
- `constants/` — Format & codec constants
- `context/` — Image state context
- `types/` — Types

**Supported formats:**
- Input: JPEG, PNG, WebP, GIF, AVIF, etc.
- Output: JPEG, PNG, WebP, AVIF

**Processing:** Uses jsquash libraries (WASM-based) entirely in-browser.

---

### C. Email Sender (`src/emailSender/`)

| File | Purpose |
|------|---------|
| `EmailSenderContext.tsx` | State & server communication |
| `EmailSenderPanel.tsx` | Main UI |
| `EmailCredentialsForm.tsx` | Credentials input form |
| `EmailHtmlEditor.tsx` | HTML editor (CodeMirror) |
| `StorageToggle.tsx` | localStorage vs env storage toggle |
| `types.ts` | Module types |

**Supported SMTP providers:** Gmail, Outlook, Yahoo (auto-detected from email domain).

**Credentials storage options:** localStorage / environment variables

---

### D. Block Library (`src/blockLibrary/`)

| File | Purpose |
|------|---------|
| `BlockLibrary.tsx` | Main UI |
| `BlockItem.tsx` | Single block display |
| `AddBlockModal.tsx` | Create custom block |
| `BlockStorageModal.tsx` | Configure storage path |
| `ResizablePreview.tsx` | Block preview with resize |
| `blockFileApi.ts` | Backend API calls |
| `blockLoader.ts` | Dynamic block loading |
| `blockStorageConfig.ts` | Storage paths config |

**Block categories:** Structure, Content, Buttons, Footer, Headers, Social, Custom

**Block sources:**
- `src/blocks/*.ts` — Built-in TypeScript block definitions
- Server `data/` directory — Persistent custom blocks
- localStorage — Temporary custom blocks

---

### E. Template Library (`src/templateLibrary/`)

- `TemplateLibrary.tsx` — Main UI
- `components/` (12 files) — Search, filter, sync controls, etc.
- `hooks/` — Template loading & sync logic
- `utils/` — Path resolution

**Storage:** User specifies absolute paths to template directories via UI. Paths saved in localStorage. Server scans those directories and returns template files.

---

### F. Email Validator (`src/emailValidator/`)

| File | Purpose |
|------|---------|
| `ValidationEngine.ts` | Validation rules & orchestration |
| `AutofixEngine.ts` | Auto-fix capabilities |
| `EmailHTMLValidator.ts` | Main validator class |
| `validationRules.ts` | Rule definitions (tags, CSS, a11y) |
| `regexPatterns.ts` | Regex for detection |
| `htmlParser.ts` | HTML parsing logic |
| `cache.ts` | Validation result cache |

**Rule categories:** tag validation, CSS support, accessibility, email client compatibility.

---

## Backend API (`/server/` — port 3001)

### Middleware
- **Helmet** — security headers
- **CORS** — allows localhost + GitHub Pages
- **Rate Limit** — 1000 req/15min (disabled for localhost)
- **Body Parser** — 50MB limit

### Health Check
```
GET /api/health → { status: "ok", timestamp }
```

### Blocks API
```
GET    /api/blocks/list          → list all blocks
GET    /api/blocks/:id           → get block by ID
POST   /api/blocks               → create custom block
PUT    /api/blocks/:id           → update block
DELETE /api/blocks/:id           → delete block
GET    /api/blocks/search        → search blocks
GET    /api/custom-blocks        → user-created blocks only
```

### Templates API
```
GET    /api/templates/list       → list templates
GET    /api/templates/:id        → get by ID
GET    /api/templates/:id/content → get HTML content
POST   /api/templates            → create
PUT    /api/templates/:id        → update
DELETE /api/templates/:id        → delete
POST   /api/templates/:id/sync  → sync single from filesystem
POST   /api/templates/sync-all  → sync all from configured paths
```

### Email API
```
POST /api/send-email    → { userEmail, subject, html, senderEmail, appPassword }
POST /api/verify-smtp   → { smtp: { host, port, secure, user, pass } }
```

### Image Conversion API
```
POST /api/image-converter/convert → FormData: image + format + quality + dimensions
                                  ← { originalSize, convertedSize, format, data (base64) }
```

### Storage API
```
GET  /api/storage-paths          → get configured storage paths
POST /api/storage/upload         → upload to storage provider (triggers browser automation)
```

### Server Manager Classes

**`BlockFileManager` (`blockFileManager.ts`):**
- `listBlocks()`, `searchBlocks(query, category)`, `getBlockById(id)`, `createBlock()`, `updateBlock()`, `deleteBlock()`, `importBlock(filePath)`
- Caches blocks, watches filesystem with chokidar

**`TemplateManager` (`templateManager.ts`):**
- `listTemplates(filters)`, `syncTemplates(paths)`, `getTemplateById(id)`, `createTemplate()`, `deleteTemplate()`
- Supports multiple template paths, watches for filesystem changes

**`PathValidator` (`pathValidator.ts`):**
- Platform-specific path resolution (Windows/Mac/Linux)
- Prevents directory traversal attacks

---

## AI Integration — two independent provider paths, no shared backend

Image analysis (ALT-text/filename/CTA) has **two providers**, selected client-side via `imageAnalysis.backendProvider: "ollama" | "cloudflare"` (`src/htmlConverter/types.ts`). They do not share an implementation — Ollama goes through the local Node server, Cloudflare bypasses it entirely.

### Ollama (`server/routes/aiProxy.js` + `server/aiProviders/`, mounted at `/ai-api`)

Unchanged from before Cloudflare support existed. No separate Python microservice — that used to be a FastAPI + PaddleOCR + CLIP + Gemma 3 process on port 8000, removed and replaced by this single Express route, which proxies to a local/LAN Ollama instance (`server/aiProviders/ollamaProvider.js`).

```
GET    /ai-api/health         → { status, ollama_running, ollama_host }
GET    /ai-api/api/models     → models currently pulled in Ollama
POST   /ai-api/api/analyze    → image upload → { filename, alt_text, cta, raw, cached, warning? }
POST   /ai-api/api/test       → prompt roundtrip (latency check)
DELETE /ai-api/api/cache      → clear in-memory response cache
GET    /ai-api/api/settings   → current host/model/generation params/prompt
PUT    /ai-api/api/settings   → update host/model/generation params/prompt
```

Resizes the uploaded image to ≤768px JPEG (Sharp), sends to `/api/generate` with `format:"json"` and a fixed prompt; `server/aiProviders/shared.js`'s `extractJsonFromText()` defensively parses the response (direct parse → fenced code block → first-`{`-to-last-`}` substring) rather than trusting `format:"json"` blindly. If the configured model isn't pulled, silently falls back to whatever *is* installed and returns a `warning`. Settings persist to `ollama-settings.json` (next to `ELECTRON_USER_DATA`, or cwd in dev/web). `/ai-api` is proxied by Vite to the same backend port as `/api` — **GitHub Pages (UI-only demo) cannot reach this path at all**, it needs the local Express backend running.

### Cloudflare Workers AI — client-side only, no local server involved

For machines too weak to run Ollama locally (e.g. a MacBook Air), or for the GitHub Pages demo where no backend exists. **Everything happens in the browser/Electron renderer** — `src/htmlConverter/utils/ocr/cloudflareClient.ts` resizes the image client-side (reusing `src/imageConverter/utils/resizeImageData.ts` + `jsquashEncode.ts`, the same jsquash/WASM pipeline the Image Converter tab already uses) and POSTs straight to a public Cloudflare Worker — `cloudflare-worker/src/worker.js`, deployed independently (`cloudflare-worker/README.md`), **not part of `npm run build`/`npm run dev`**. Live at `https://email-helper-ai.vinnikmisha.workers.dev`.

**Why a Worker and not a direct browser→Cloudflare call**: confirmed live (`curl -X OPTIONS api.cloudflare.com/...`) that `api.cloudflare.com` sends no CORS headers at all (405, no `Access-Control-Allow-Origin`) — a browser cannot call it directly under any circumstances, regardless of token. The Worker is a CORS-safe relay, not an optional convenience.

**Two auth modes through the same Worker endpoint**, selected by whether the request body includes `accountId`/`apiToken`:
- **No credentials (default, zero-config)** — Worker uses its own native `env.AI.run()` binding (no token anywhere in the code, authenticated inside Cloudflare's platform). Protected by a CORS allowlist (`https://misha-vynnyk.github.io` + local dev origins) and a per-IP KV-backed rate limit (20 req/60s) — the Worker's URL is necessarily public (shipped in the JS bundle), and the free daily quota is shared across every caller.
- **User's own `accountId`/`apiToken`**, entered in Налаштування (`ImageSettingsTab.tsx`) and stored client-side via `src/hooks/useCloudflareCredentials.ts` — `safeStorage`-encrypted in Electron (new IPC channels `credentials:saveCloudflare`/`loadCloudflare`/`clearCloudflare` in `electron/main.ts`+`preload.ts`), plain `localStorage` in the browser (same risk-acceptance precedent as the existing SMTP app-password storage). The Worker relays server-to-server to `api.cloudflare.com` using the caller's token (no CORS issue there — Worker-to-Cloudflare isn't a browser request) and skips its own rate limit, since it's the user's own quota. The token transits through the Worker's request handling for one request only — never logged or persisted by it.

**Model is fixed, not user-selectable**: `@cf/moondream/moondream3.1-9B-A2B` (Moondream 3.1) — the fastest and cheapest-per-token vision model in the free-tier catalog, hardcoded as `MODEL` in `worker.js`. No vision model on Workers AI guarantees JSON-mode (`response_format`/`json_schema`), so the Worker asks for JSON in the prompt text and parses defensively via its own copy of `extractJsonFromText()` — same technique as the Ollama path, independently implemented (Workers runtime can't `require()` the Node backend's copy).

**Two live-discovered gotchas in `worker.js`, neither documented by Cloudflare** (found via `console.log` + `wrangler tail` against the real deployed Worker, not from docs):
1. `env.AI.run()`'s resolved value for Moondream's `query` task is `{result: {answer, finish_reason, metrics, ...}, usage: {...}}` — one level deeper than `wrangler ai models schema '@cf/moondream/moondream3.1-9B-A2B'` implies (that command only shows the inner `result` shape). `unwrapResult()` handles both the wrapped and unwrapped case defensively.
2. The binding sometimes hands back a `ReadableStream` of SSE `data: {...}` chunks instead of a resolved object for this model, regardless of the `stream:false` payload param (a binding-vs-REST-API inconsistency — the REST endpoint's `stream:false` buffers server-side, the raw binding here does not always). `readStreamText()` consumes and reconstructs the text when `result instanceof ReadableStream`. `reasoning` also defaults to `true` in Moondream's schema (extra chain-of-thought tokens/latency) — explicitly set `reasoning:false` in the payload to avoid it.

### Requirements
- **Ollama**: running locally (or reachable via `OLLAMA_HOST`) with a vision-capable model pulled — default is `qwen2.5vl:latest`, but any Ollama vision model works.
- **Cloudflare**: nothing required to just use it (public Worker is zero-config). To deploy your own Worker or use your own account's quota: see `cloudflare-worker/README.md` (`wrangler login && wrangler deploy`) — a manual, one-time action, not something automatable from this repo alone.
- No Python, no `OMP_NUM_THREADS` tuning, no PaddleOCR/CLIP dependencies — those were specific to the removed FastAPI service.

---

## Browser Automation (`/automation/`)

Uses Playwright Core + Brave browser via Chrome DevTools Protocol.

### Storage Providers (`automation/config.json`)

| Provider | Bucket | Domain | Categories | Debug Port |
|----------|--------|--------|-----------|-----------|
| `default` | files | storage.5th-elementagency.com | finance, health | 9222 |
| `alphaone` | alphaone | alphaonest.com | none | 9223 |
| `ttt` | organic | ogfinstorage.com | none | 9224 |

### Upload Flow
1. Prepare files (HTML, images, CSS)
2. Launch Brave via CDP (Playwright Core)
3. Login to storage provider (if needed)
4. Upload to specified folder/bucket
5. Generate public URLs
6. Update HTML with new URLs
7. Return updated files

### CLI Usage
```bash
npm run automation:upload -- ./image.png [category] [--provider default|alphaone|ttt]
```

### Setup (auto on `npm install`)
`automation/setup_all.js` → `automation/setup.js`:
- Detects Brave browser installation path per platform
- Auto-configures `config.json`
- Installs playwright-core

---

## Dev Setup & Build

### Environment Variables (`.env.example`)
```
VITE_EMAIL_USER=your-email@gmail.com
VITE_DESTINATION_EMAIL_USER=your-email@gmail.com
VITE_EMAIL_PASS=your-16-char-app-password
PORT=3001
NODE_ENV=development
OLLAMA_HOST=http://localhost:11434
```

### NPM Scripts
```bash
npm run dev           # Start dev services (Vite + backend + info dashboard)
npm run dev-host      # Same but exposed on network IP
npm run dev-frontend  # Frontend only (port 5173)
npm run dev-backend   # Backend only (port 3001)
npm run build         # Production build → dist/
npm run deploy        # Build + push to GitHub Pages (gh-pages)
npm run test          # Jest tests
npm run test:coverage # Tests with coverage report
npm run dev:electron  # Electron dev shell
npm run dist:mac      # Package desktop app (macOS); dist:win for Windows
                      # (icons required — see build/ICONS_NEEDED.md)
npm run automation:upload  # Run browser upload automation
```

### Multi-Instance Support
```bash
npm run dev 0   # Instance 0: frontend=5173, backend=3001
npm run dev 1   # Instance 1: frontend=5183, backend=3011
```

### Vite Proxy (dev mode)
- `/api` → `http://127.0.0.1:3001/api`
- `/ai-api` → `http://127.0.0.1:8000`

### Vite Build Aliases
- `@` → `./src`
- `@usewaypoint/block-library` → `../block-library/src`

### Vite Base Path
- `/email-helper/` (for GitHub Pages deployment)

---

## Testing

- **Framework:** Jest ^28.1.3 + ts-jest
- **Environment:** jsdom
- **Libraries:** @testing-library/react, @testing-library/jest-dom
- **Test match:** `**/__tests__/**/*`, `**/*.test.ts(x)`, `**/*.spec.ts(x)`
- **Setup file:** `src/setupTests.ts`
- **Coverage output:** `./coverage/`

---

## Key Shared Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useApi.ts` | Generic API call hook with loading/error state |
| `useRegistrationStatus.ts` | Email credentials state |
| `useServerHealthCheck.ts` | Polls `GET /api/health` on startup |
| `useCachedImage.ts` | Cached image loading |
| `useContainerDimensions.ts` | Track container size (ResizeObserver) |
| `useDebounce.ts` | Debounce value changes |
| `useLocalStorage.ts` | Typed localStorage wrapper |

---

## Key Types (`src/types/`)

### `EmailBlock`
```typescript
{
  id: string;
  name: string;
  category: BlockCategory;
  keywords: string[];
  preview?: string;       // URL or base64
  html: string;
  createdAt: number;
  isCustom?: boolean;
  source?: "src" | "data" | "localStorage";
  filePath?: string;
}
```

### `TemplateFile`
```typescript
{
  id: string;
  name: string;
  description?: string;
  category: string;
  keywords: string[];
  html: string;
  preview?: string;
  createdAt?: number;
  updatedAt?: number;
  filePath: string;
}
```

### `EmailSender Credentials`
```typescript
{
  userEmail: string;     // recipient
  senderEmail: string;   // from address
  appPassword: string;   // SMTP app password
}
```

---

## Theme System (`src/theme/` + Tailwind)

Styling is Tailwind-based: shadcn-style CSS variables (`hsl(var(--…))`) defined in `src/index.css`, palette wired in `tailwind.config.js`. MUI was fully removed during the Tailwind migration.

| File | Purpose |
|------|---------|
| `ThemeContext.tsx` | Dark/light mode state |
| `ThemeToggle.tsx` | Dark/light toggle button |
| `index.ts` | Public exports |
| `examples/` | Reference screens for the design system |

---

## Utilities (`src/utils/`)

| File | Purpose |
|------|---------|
| `logger.ts` | Logging utility |
| `imageCache.ts` | IndexedDB-based image cache |
| `imageUrlReplacer.ts` | Replace image URLs in HTML |
| `blockImagePreloader.ts` | Batch preload block preview images |
| `storageConfigManager.ts` | Manage storage config in localStorage |
| `storageKeys.ts` | localStorage key constants |
| `pathUtils.ts` | Path manipulation helpers |
| `codemirrorTheme.ts` | CodeMirror editor theme |

---

## Image Caching Layers

1. **Browser Cache** — standard HTTP
2. **IndexedDB** (`src/utils/imageCache.ts`) — persistent cross-session
3. **Memory** — in-memory for current session

---

## Deployment

### GitHub Pages (UI only)
```bash
npm run build
npm run deploy    # pushes dist/ to gh-pages branch
```
Base path: `/email-helper/`

### Full Stack
- Frontend: Vite build → any static host
- Backend: Node.js 18+ required, set `PORT` env var
- AI: Ollama running locally (or reachable via `OLLAMA_HOST`) with a vision-capable model pulled — no separate Python service to deploy

---

## Common Development Workflows

### Add a New Email Block
1. Create `src/blocks/my-block.ts` exporting an `EmailBlock` object
2. Server auto-scans on next reload
3. Appears in BlockLibrary UI

### Add a New Template
1. Place HTML file in a configured template directory
2. Click "Sync New" in TemplateLibrary
3. Template appears in the list

### Add a Custom Validation Rule
1. Edit `src/emailValidator/validationRules.ts`
2. Add rule to the appropriate category
3. Rule auto-applies on next validation run

### Upload Files to Storage
```bash
# Via UI: HtmlConverterPanel → StorageUploadDialog
# Via CLI:
npm run automation:upload -- ./file.png health --provider default
```

### Run AI Features
Default provider is Ollama — needs it running locally with a vision-capable model pulled (no separate service to start — `aiProxy.js` is part of the regular backend, started by `npm run dev`/`dev-backend`):
```bash
ollama pull qwen2.5vl:latest   # or any other Ollama vision model; configurable in Settings
npm run dev
```
Alternatively, switch the provider to **Cloudflare Workers AI** in Налаштування → AI аналіз зображень (useful on machines too weak to run Ollama locally, e.g. a MacBook Air) — zero-config by default (public shared Worker), or enter your own Cloudflare Account ID + API Token in that same panel for your own quota. No `.env` var, no local model pull, no backend involved at all for this path.

---

## Architecture Notes

- **No traditional router** — tab-based SPA navigation
- **Server is required** for full functionality (blocks, templates, email, image conversion via Sharp)
- **AI features are optional** — Ollama path gracefully degrades (`aiProxy.js` returns a 503 with a clear message when Ollama isn't running); Cloudflare path needs no local backend at all — it either hits the public zero-config Worker or, with a user-supplied token, the same Worker relaying to `api.cloudflare.com`
- **Automation requires Brave browser** — configured automatically on `npm install`
- **Multi-instance dev** — each instance uses different ports (offset by 10 per instance)
- **Frontend proxies all `/api` and `/ai-api` requests** in dev mode via Vite proxy
