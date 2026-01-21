# 🤖 Automation Scripts

Playwright-based scripts для автоматичного завантаження зображень на storage.

## 🚀 Quick Start

```bash
# Install
npm install

# Usage
node scripts/upload-playwright-brave.js /path/to/image.jpg finance ABCD123

# Shortcuts
./save-in-finance.sh /path/to/image.jpg ABCD123
./save-in-health.sh /path/to/image.jpg HEALTH456
```

## 📋 Requirements

- Node.js >= 18
- Brave Browser with CDP enabled:
  ```bash
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
    --remote-debugging-port=9222
  ```

## 📚 Documentation

**[→ Full Documentation](../AUTOMATION.md)**

## 📁 Files

```
scripts/
├── upload-playwright-brave.js   # Main script
└── upload-form.html             # Test form

save-in-finance.sh              # Finance shortcut
save-in-health.sh               # Health shortcut
config.json                     # Configuration
```

## ⚙️ Configuration

Edit `config.json`:

```json
{
  "browser": "brave",
  "headless": false,
  "timeout": 300000,
  "cdpEndpoint": "http://127.0.0.1:9222"
}
```

---

**More details:** See [AUTOMATION.md](../AUTOMATION.md) and [HTML_CONVERTER.md](../HTML_CONVERTER.md)
