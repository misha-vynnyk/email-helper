# Backend Security and Architecture Audit

This document outlines identified issues in the `@usewaypoint/editor-sample-server` (FlexiBuilder Pro Backend) found during the audit on 2026-03-30.

## 🔴 High Priority

### 1. TypeScript Code Injection in `BlockFileManager`
**File:** `server/blockFileManager.ts` (and compiled `.js`)
**Issue:** The `generateBlockCode` method uses string interpolation to build a `.ts` file without sufficient sanitization of user-provided metadata (`name`, `category`, `keywords`, `preview`).
**Impact:** Remote Code Execution (RCE). An attacker can inject arbitrary TypeScript/JavaScript code that will be executed when the project is compiled or run via the dev server.
**Example Payload:**
```json
{
  "name": "My Block', keywords: [] }; console.log('Hacked!'); //"
}
```
**Recommended Fix:** Use `JSON.stringify()` for all values being interpolated into the code template to ensure proper escaping.

---

## 🟡 Medium Priority

### 2. SSRF (Server-Side Request Forgery) in Image Converter
**File:** `server/routes/imageConverter.js`
**Endpoint:** `POST /api/image-converter/convert-from-url`
**Issue:** The endpoint fetches arbitrary URLs provided in the request body. While it checks for `http/https`, it does not block internal IP ranges (localhost, private subnets).
**Impact:** Attackers can use the server to scan internal networks, access metadata services (AWS/GCP), or bypass firewalls.
**Recommended Fix:** Implement an IP blacklist for private/internal ranges (e.g., `127.0.0.0/8`, `10.0.0.0/8`, etc.) before fetching.

### 3. Potential OOM (Out of Memory) DoS
**File:** `server/routes/imageConverter.js`
**Issue:** Using `multer.memoryStorage()` with a 50MB limit per file and up to 50 files in a batch (`convert-batch`).
**Impact:** A single request could consume ~2.5GB of RAM, potentially causing the Node.js process to crash due to OOM.
**Recommended Fix:** Use `multer.diskStorage()` for temporary uploads or strictly limit the number of files and their cumulative size in batch requests.

### 4. Unprotected Internal API
**File:** `server/index.js`
**Issue:** The server lacks any authentication or authorization middleware.
**Impact:** Even if intended for local use, the server is vulnerable if the machine is exposed to a local network or if the user visits a malicious site that exploits the relaxed CORS policy.
**Recommended Fix:** Add a basic API key or token-based authentication, even for local development.

---

## 🟢 Low Priority

### 5. Redundant and Out-of-Sync Files
**Location:** `server/` root
**Issue:** Many `.js` files exist in the root (e.g., `blockFileManager.js`) that are different from those in `dist/`. For example, `server/blockFileManager.js` is ~28KB while `server/dist/blockFileManager.js` is ~19KB.
**Impact:** Confusion during debugging and potential runtime inconsistencies if different parts of the app require different versions of the same logic.
**Recommended Fix:** Remove all compiled `.js` files from the source directories and rely solely on the `dist/` directory.

### 6. Excessive JSON Payload Limits
**File:** `server/index.js`
**Issue:** `express.json({ limit: "50mb" })` is set globally.
**Impact:** Allows a malicious client to send massive JSON objects, consuming CPU and memory to parse data that is likely unnecessary for most API routes.
**Recommended Fix:** Set a much lower global limit (e.g., 1MB) and apply larger limits only to specific routes that require them.

### 7. Duplicate CORS Origins
**File:** `server/index.js`
**Issue:** `https://misha-vynnyk.github.io` is added to `allowedOrigins` twice (lines 29 and 39).
**Impact:** Minor maintenance overhead and redundant logic.
**Recommended Fix:** Consolidate origin definitions in one place.
