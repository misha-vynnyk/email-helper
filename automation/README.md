# Automation Module - Setup and Configuration

## Overview

This directory contains automated upload scripts for images and files to storage providers using Brave Browser.

## Automatic Setup

When you run `npm install` in the root directory, the automation module is automatically configured:

1. **Dependencies Installation**: `playwright-core` is installed
2. **Path Validation**: Platform-specific paths (macOS, Windows, Linux) are automatically detected and configured
3. **Config Updates**: Paths are updated to match the current user's home directory

## Manual Configuration

If you need to override settings, you can:

### Environment Variables

Set these before running an upload:

```bash
# Override Brave executable path
export BRAVE_EXECUTABLE_PATH=/path/to/brave  # macOS/Linux
set BRAVE_EXECUTABLE_PATH=C:\Path\To\brave.exe  # Windows

# Override user data directory
export BRAVE_USER_DATA_DIR=/path/to/profile  # macOS/Linux
set BRAVE_USER_DATA_DIR=C:\Path\To\profile  # Windows

# Specify storage provider
export STORAGE_PROVIDER=default  # or 'alphaone'
```

### Config File

Edit `automation/config.json` directly if needed. The configuration includes:

- **browser**: Brave executable path and debug port settings
- **browserProfiles**: Named profiles for different Brave instances
- **storage**: Base URLs for storage providers
- **storageProviders**: Configuration for each provider (default, alphaone)

## Usage

```bash
# Upload a file
npm run automation:upload -- ./image.png

# Upload with category
npm run automation:upload -- ./image.png finance

# Upload to specific provider
npm run automation:upload -- ./image.png --provider alphaone

# Skip confirmation
npm run automation:upload -- ./image.png --no-confirm
```

## Troubleshooting

### "Playwright dependency is missing"

Run in root directory:

```bash
npm install
```

### "Brave Browser not found"

**macOS**:

```bash
# Install Brave
brew install brave-browser

# Or set path manually
export BRAVE_EXECUTABLE_PATH=/Applications/Brave\ Browser.app/Contents/MacOS/Brave\ Browser
```

**Windows**:

```batch
REM Install from https://brave.com/download/
REM Or set path manually
set BRAVE_EXECUTABLE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
```

**Linux**:

```bash
# Install Brave
sudo apt install brave-browser

# Or set path manually
export BRAVE_EXECUTABLE_PATH=/usr/bin/brave-browser
```

### Config paths are invalid

The setup script automatically fixes platform-specific paths when you run `npm install`. If paths are still wrong:

1. Check the error message for the expected path
2. Install the missing software, or
3. Set the appropriate environment variable

## Platform Support

- ✅ macOS (Intel/Apple Silicon)
- ✅ Windows 10/11
- ✅ Linux (Debian/Ubuntu, etc.)

## Files

- `setup.js` - Runs automatically during `npm install` to validate and fix paths
- `run-upload.js` - Cross-platform entry point for uploads
- `scripts/upload-playwright-brave.js` - Main upload logic
- `config.json` - Configuration file (auto-updated on setup)
