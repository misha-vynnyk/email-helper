const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Import blocks routes
const blocksRouter = require('./routes/blocks');
const customBlocksRouter = require('./routes/customBlocks');
const blockFilesRouter = require('./routes/blockFiles');
const templatesRouter = require('./routes/templates');
const imageConverterRouter = require('./routes/imageConverter');
const storagePathsRouter = require('./routes/storagePaths');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment-based CORS
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.ALLOWED_ORIGIN]
    : ['http://localhost:5173', 'http://localhost:3000'];

// Validate ALLOWED_ORIGIN in production
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGIN) {
  console.error('❌ CRITICAL: ALLOWED_ORIGIN environment variable must be set in production!');
  console.error('Example: ALLOWED_ORIGIN=https://your-username.github.io');
  process.exit(1);
}

// Add rate limiting (disabled in development for better DX)
const rateLimit = require('express-rate-limit');

// In development: Higher limit to support lazy loading + React Strict Mode
// In production: Standard limit
const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isDev ? 1000 : 100), // Dev: 1000, Prod: 100
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Only apply rate limiting in production or when explicitly enabled
if (!isDev || process.env.ENABLE_RATE_LIMIT_DEV === '1') {
  app.use('/api/', limiter);
  console.log(`🔒 Rate limiting: ${isDev ? '1000' : '100'} requests per 15min`);
} else {
  console.log('⚡ Rate limiting: DISABLED (development mode)');
}

// Add helmet for security headers
const helmet = require('helmet');
app.use(helmet());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
        : process.env.ALLOW_ALL_CORS_DEV === '1'
          ? true
          : function (origin, callback) {
              if (!origin) return callback(null, true);
              if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
              } else {
                callback(new Error('Not allowed by CORS'));
              }
            },
    credentials: true,
  })
);

// Обмеження розміру запиту
app.use(express.json({ limit: '2mb' }));

// Use blocks routes
app.use('/api/blocks', blocksRouter);
app.use('/api/custom-blocks', customBlocksRouter);
app.use('/api/block-files', blockFilesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/image', imageConverterRouter);
app.use('/api/storage', storagePathsRouter);

// Middleware для валідації email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Middleware для валідації HTML
const validateHTML = (html) => {
  if (!html || typeof html !== 'string') return false;
  if (html.length > 500000) return false; // Обмеження розміру HTML (500KB)
  return true;
};

app.post('/api/send-email', async (req, res) => {
  const { html, subject, userEmail, senderEmail, appPassword } = req.body;

  // Валідація обов'язкових полів
  if (!html || !userEmail || !senderEmail || !appPassword) {
    return res.status(400).json({
      error: 'Missing required fields: html, userEmail, senderEmail, or appPassword',
    });
  }

  // Валідація email адрес
  if (!validateEmail(userEmail) || !validateEmail(senderEmail)) {
    return res.status(400).json({
      error: 'Invalid email format',
    });
  }

  // Валідація HTML
  if (!validateHTML(html)) {
    return res.status(400).json({
      error: `Invalid HTML content or content too large (max ${500000} characters)`,
    });
  }

  // Валідація subject
  if (subject && subject.length > 200) {
    return res.status(400).json({
      error: 'Subject too long (max 200 characters)',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: userEmail,
        pass: appPassword,
      },
    });

    // Перевірка з'єднання
    await transporter.verify();

    await transporter.sendMail({
      from: userEmail,
      to: senderEmail,
      subject: subject || 'No subject',
      html,
    });

    res.json({ message: '✅ Email sent successfully' });
  } catch (error) {
    console.error('❌ Send email error:', error);

    // Більш детальні повідомлення про помилки
    let errorMessage = '❌ Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = '❌ Authentication failed. Please check your email and app password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = '❌ Connection failed. Please check your internet connection.';
    }

    res.status(500).json({ error: errorMessage });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Email Template Sender Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      sendEmail: '/api/send-email',
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
