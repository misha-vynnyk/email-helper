# Automation Setup Guide - Windows

## Prerequisites

- Node.js (v18+)
- Brave Browser (or any Chromium-based browser)

## Installation

### Step 1: Clone/Download Project

```bash
git clone <your-repo>
cd email-helper
```

### Step 2: Install Dependencies (Automatic)

Run in the root directory:

```bash
npm install
```

This will automatically:

- Install all main dependencies
- Install automation module dependencies (playwright-core)
- Validate and configure paths for Windows

### Step 3: Install Brave Browser (if not already installed)

Download and install from: https://brave.com/download/

## Configuration

No manual configuration needed in most cases. The setup script automatically detects and configures everything.

If paths need to be overridden, you can set environment variables:

```batch
REM Set Brave executable path
set BRAVE_EXECUTABLE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe

REM Set custom user data directory
set BRAVE_USER_DATA_DIR=C:\Users\YourName\AppData\Roaming\BravePlaywright

REM Set storage provider
set STORAGE_PROVIDER=default
```

Or manually edit `automation/config.json`.

## Usage

### Using npm scripts

```bash
npm run automation:upload -- image.png
npm run automation:upload -- image.png finance
npm run automation:upload -- image.png --provider alphaone
```

### Using batch file (optional)

```batch
automation\upload.bat image.png
automation\upload.bat image.png finance
```

## Troubleshooting

### "Brave Browser not found"

**Check Installation**:

1. Verify Brave is installed: Look in `Program Files` or `Program Files (x86)`
2. Default path: `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`

**Set Custom Path**:

```batch
set BRAVE_EXECUTABLE_PATH=C:\Your\Path\To\brave.exe
npm run automation:upload -- image.png
```

### "Playwright dependency is missing"

Run from root directory:

```bash
npm install
```

Or manually:

```bash
npm --prefix automation install
```

### Dependencies not installed automatically

If automatic setup failed, run these commands:

```bash
REM Install root dependencies
npm install

REM Install automation dependencies
npm --prefix automation install
```

## Verifying Installation

Test that everything is set up correctly:

```bash
REM Check Node.js version
node --version

REM Check npm modules
npm list --prefix automation playwright-core

REM Check config validity
node automation/run-upload.js --help
```

## Environment Variables (Optional)

You can create a `.env` file or `.env.local` file to store environment variables:

```text
BRAVE_EXECUTABLE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
BRAVE_USER_DATA_DIR=C:\Users\YourName\AppData\Roaming\BravePlaywright-Work
STORAGE_PROVIDER=default
```

Then use them:

```batch
setlocal enabledelayedexpansion
for /f "delims==" %%a in (.env.local) do set "%%a"
npm run automation:upload -- image.png
```

## Tips for Development

- Keep `automation/config.json` updated with your settings
- User data directories are created automatically on first run
- Error messages will tell you exactly what's wrong and how to fix it
- Check `automation/README.md` for more details

## Contact & Support

If issues persist, check the error message carefully - it includes specific instructions for your OS and situation.
