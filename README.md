# Email Helper - Professional Email Builder

Professional email template builder with drag-and-drop block system, live preview, and local file management.

## 🎨 Demo

**Live Preview:** https://misha-vynnyk.github.io/email-helper/

> ⚠️ **Note:** The GitHub Pages demo shows only the interface. For full functionality (block/template management, email sending, image conversion), run the app locally.

## 🚀 Features

- **Block Library** - Manage and customize email blocks with drag-and-drop
- **Live Preview** - Real-time email rendering with responsive design preview
- **Template Management** - Save and reuse email templates
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

## 🖼️ Image Conversion

The image converter supports:
- Multiple formats: JPEG, WebP, AVIF, PNG, GIF
- Advanced compression with quality optimization
- Batch processing
- Client-side and server-side conversion
- GIF optimization with target file size control

## 📁 Project Structure

```
email-helper/
├── src/                    # Frontend source
│   ├── App/               # Main app layout
│   ├── blockLibrary/      # Block management
│   ├── components/        # Shared components
│   ├── emailSender/       # Email sending
│   ├── emailValidator/    # HTML validation
│   ├── imageConverter/    # Image processing
│   ├── templateLibrary/   # Template management
│   └── theme/             # Theme system
├── server/                # Backend API
│   ├── routes/           # API endpoints
│   └── utils/            # Utilities
└── dist/                 # Production build
```

## 🎨 Themes

The app includes a customizable theme system:
- Light/Dark mode toggle
- Multiple component styles (floating, glassmorphism, neomorphic)
- Consistent design tokens

## 🚀 Development

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

## 📝 License

MIT

## 👤 Author

Mykhailo Vynnyk
