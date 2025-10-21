# Server Environment Configuration

## Cross-Platform Storage Configuration

### Default Behavior

If you don't set any environment variables, the server uses OS-specific defaults:

**macOS:**

```
~/Library/Application Support/EmailBuilder/
  ├── blocks/
  ├── templates/
  └── images/
```

**Windows:**

```
%APPDATA%\EmailBuilder\
  ├── blocks\
  ├── templates\
  └── images\
```

**Linux:**

```
~/.local/share/EmailBuilder/
  ├── blocks/
  ├── templates/
  └── images/
```

**Development (all OS):**

```
./data/
  ├── blocks/
  ├── templates/
  └── images/
```

---

## Environment Variables

Create `.env` file in `packages/editor-sample/server/` with these variables:

### Server Configuration

```bash
PORT=3001
NODE_ENV=development  # or 'production'
```

### Security (REQUIRED in production)

```bash
# CORS - REQUIRED in production
ALLOWED_ORIGIN=https://your-username.github.io

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

### Storage Paths (Optional - uses OS defaults if not set)

```bash
# Custom Blocks Storage
CUSTOM_BLOCKS_DIR=

# TypeScript Block Files
BLOCK_FILES_DIR=

# Templates Directory
TEMPLATES_DIR=

# Template Metadata
TEMPLATE_METADATA_PATH=

# Template Import Roots (comma-separated)
TEMPLATE_ROOTS=

# Images Storage
IMAGES_DIR=

# Logs Directory
LOGS_DIR=
```

---

## Platform-Specific Examples

### macOS Configuration

```bash
# .env for macOS
PORT=3001
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5173

# Custom paths (optional)
TEMPLATES_DIR=~/Documents/EmailTemplates
TEMPLATE_ROOTS=~/Documents/EmailTemplates,~/Templates
```

### Windows Configuration

```bash
# .env for Windows
PORT=3001
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5173

# Custom paths (optional) - use forward slashes or escaped backslashes
TEMPLATES_DIR=C:/Users/YourName/Documents/EmailTemplates
TEMPLATE_ROOTS=C:/Users/YourName/Documents/EmailTemplates,C:/Templates
```

### Linux Configuration

```bash
# .env for Linux
PORT=3001
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5173

# Custom paths (optional)
TEMPLATES_DIR=~/Documents/EmailTemplates
TEMPLATE_ROOTS=~/Documents/EmailTemplates,~/templates
```

---

## Web Interface Configuration

You can also configure template roots from the web interface:

1. Open Block Library or Template Library
2. Click Settings icon
3. Open "Storage Settings"
4. Add custom template folders
5. Save

Settings are stored in browser localStorage and persist across sessions.

---

## Production Deployment

For production on Render.com/Vercel:

```bash
NODE_ENV=production
ALLOWED_ORIGIN=https://your-username.github.io
RATE_LIMIT_MAX_REQUESTS=100

# Leave storage paths empty to use OS defaults
# Or set absolute paths for custom locations
```

The server will use platform-appropriate directories automatically.
