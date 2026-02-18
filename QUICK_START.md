# Quick Start Guide

## 🚀 Installation (One-Time)

```bash
npm install
```

This automatically:

- ✅ Installs all project dependencies
- ✅ Installs server dependencies
- ✅ Installs automation module (Playwright)
- ✅ Validates and configures paths for your OS (Windows/macOS/Linux)
- ✅ Shows clear error messages if something is wrong

## 🎯 Running the Application

```bash
npm run dev
```

Open your browser: **http://localhost:5173**

## 📤 Uploading Files

```bash
npm run automation:upload -- ./image.png
npm run automation:upload -- ./image.png finance
```

## ⚠️ Troubleshooting

### "Playwrite dependency is missing"

→ Run: `npm install` in root directory

### "Brave Browser not found"

→ Install Brave from https://brave.com/download/
→ Or set: `export BRAVE_EXECUTABLE_PATH=/path/to/brave`

### On Windows?

→ See [AUTOMATION_SETUP_WINDOWS.md](AUTOMATION_SETUP_WINDOWS.md)

### More details?

→ See [README.md](README.md) and [automation/README.md](automation/README.md)

---

**That's it!** Everything else is handled automatically. 🎉
