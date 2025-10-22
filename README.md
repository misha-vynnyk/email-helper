# FlexiBuilder Pro - Email Builder

Professional email template builder with drag-and-drop block system.

## 🌐 Live Demo

**Frontend:** https://misha-vynnyk.github.io/email-helper/
**Backend API:** https://email-helper-backend.onrender.com

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

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start development servers (frontend + backend)
npm run dev

# Or start separately
npm run dev-frontend  # Frontend only
npm run dev-backend   # Backend only
```

### Build

```bash
# Build frontend for production
npm run build

# Build backend
cd server && npm run build
```

## 🌐 Deployment

### Frontend (GitHub Pages)

```bash
npm run deploy
```

### Backend (Render)

- Auto-deploys from main branch
- Environment variables configured in Render dashboard

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

## 🔑 Environment Variables

### Backend (.env)

```env
PORT=3001
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

## 📝 License

MIT

## 👤 Author

Mykhailo Vynnyk
