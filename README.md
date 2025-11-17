# Email Helper - Professional Email Builder

Professional email template builder with drag-and-drop block system, live preview, and local file management.

## 🎨 Demo

**UI Preview:** https://misha-vynnyk.github.io/email-helper/

> ⚠️ **Note:** The GitHub Pages demo shows only the interface. For full functionality (block/template management, email sending), run the app locally.

## 🚀 Features

- **Dynamic Block Library** - Add, edit, and manage email blocks with custom storage locations
- **Live Preview** - Real-time email rendering with responsive design preview
- **Template Management** - Save and reuse email templates
- **Image Converter** - Convert images to base64 or upload to CDN
- **Email Validation** - Built-in HTML validator for email compatibility
- **Email Sender** - Send test emails directly from the editor

## 📦 Tech Stack

### Frontend

- React 18 + TypeScript
- Vite
- Material-UI (MUI)
- Zustand (State Management)
- CodeMirror (HTML Editor)
- Framer Motion (Animations)

### Backend

- Node.js + Express
- TypeScript
- Sharp (Image Processing)
- Nodemailer (Email Sending)

## 🛠️ Local Setup

This app is designed to run **locally** for full functionality. The backend manages local files for blocks and templates.

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Gmail account with App Password (for email sending)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/misha-vynnyk/email-helper.git
cd email-helper

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Start backend (Terminal 1)
cd server && npm start

# 4. Start frontend (Terminal 2)
npm run dev

# 5. Open browser
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Email Setup

To send test emails, you need a Gmail App Password:

1. Enable 2FA on your Google Account
2. Go to Google Account → Security → App Passwords
3. Generate new password for "Mail"
4. Use this password in the Email Sender panel (not your regular Gmail password)

### Development Commands

```bash
# Build frontend for production (GitHub Pages demo)
npm run build

# Deploy frontend to GitHub Pages (UI demo only)
npm run deploy

# Build backend
cd server && npm run build

# Run backend in production mode
cd server && npm start
```

## 📁 Project Structure

```
email-helper/
├── src/                    # Frontend source
│   ├── blockLibrary/       # Block management system
│   ├── components/         # React components
│   ├── emailSender/        # Email sending functionality
│   ├── emailValidator/     # HTML validation
│   ├── imageConverter/     # Image processing
│   └── templateLibrary/    # Template management
├── server/                 # Backend API
│   ├── routes/             # API endpoints
│   ├── blockFileManager.ts # Block file management
│   ├── templateManager.ts  # Template management
│   └── data/               # Storage (gitignored)
└── dist/                   # Production build
```

## 📂 Storage Locations

The app stores blocks and templates in local directories:

- **Default Blocks:** `src/blocks/` (built-in examples)
- **Custom Blocks:** `server/data/blocks/files/` (your creations)
- **Templates:** Configure custom paths via Storage settings

You can add custom storage locations through the UI:

1. Click "Storage" icon in Block/Template Library
2. Add absolute paths to your local directories
3. Files are synced automatically

## 🔐 Security

The app includes a **Workspace Manager** that:

- Validates file access permissions
- Prevents path traversal attacks
- Sanitizes HTML content (XSS protection)
- Blocks access to system directories

Only explicitly allowed workspace directories can be accessed.

## 📝 License

MIT

## 👤 Author

Mykhailo Vynnyk
