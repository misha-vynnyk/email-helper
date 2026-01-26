# Email Helper - Professional Email Builder

Professional email template builder with drag-and-drop block system, live preview, and local file management.

## 🎨 Demo

**Live Preview:** https://misha-vynnyk.github.io/email-helper/

> ⚠️ **Note:** The GitHub Pages demo shows only the interface. For full functionality (block/template management, email sending, image conversion), run the app locally.

## 🚀 Features

- **Block Library** - Manage and customize email blocks with drag-and-drop
- **Live Preview** - Real-time email rendering with responsive design preview
- **Template Management** - Save and reuse email templates
- **HTML to Table Converter** ⭐ - Convert HTML to table-based email code with automated storage upload
- **Image Converter** - Convert and optimize images (JPEG, WebP, AVIF, PNG, GIF) with advanced compression
- **Email Validation** - Built-in HTML validator for email compatibility
- **Email Sender** - Send test emails directly from the editor
- **Modern UI** - Customizable themes (light/dark) with glassmorphism effects

## 📦 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Material-UI (MUI)
- CodeMirror (HTML Editor)
- Framer Motion (Animations)

**Backend:**
- Node.js + Express
- TypeScript
- Sharp (Image Processing)
- Gifsicle (GIF Optimization)
- Nodemailer (Email Sending)

## 🛠️ Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# 1. Clone repository
git clone https://github.com/misha-vynnyk/email-helper.git
cd email-helper

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Start development (both frontend & backend)
npm run dev

# Or start separately:
# Terminal 1: Backend
npm run dev-backend

# Terminal 2: Frontend
npm run dev-frontend
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📧 Email Setup

To send test emails, you need a Gmail App Password:

1. Enable 2FA on your Google Account
2. Go to Google Account → Security → App Passwords
3. Generate a password for "Mail"
4. Use this password in the Email Sender panel (not your regular Gmail password)

### GIF Optimization Setup

For GIF optimization features, Gifsicle is automatically installed as a dependency. If you encounter issues:

**macOS/Linux:**
```bash
cd server
npm install gifsicle
```

**Windows:**
```bash
cd server
npm install gifsicle
```

**Features:**
- Optimize GIFs to specific target file size (e.g., 1.5 MB)
- Adjust compression quality
- Resize GIF frames while maintaining animation
- Adaptive compression using binary search

See [GIF Optimization Documentation](src/imageConverter/GIF_OPTIMIZATION.md) for details.

### Development Commands

```bash
# Build frontend for production
npm run build

# Deploy to GitHub Pages
npm run deploy

# Build backend
cd server && npm run build

# Run backend in production
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
