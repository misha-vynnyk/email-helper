require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting - disabled for local development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for local dev (lots of template/block previews)
  skip: (req) => {
    // Skip rate limiting for localhost
    const ip = req.ip || req.connection.remoteAddress;
    return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
  },
});

// Middleware
app.use(helmet());
app.use(limiter);

// CORS configuration - allow local development and GitHub Pages demo
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/, // Allow any localhost port
  /^http:\/\/127\.0\.0\.1:\d+$/, // Allow any 127.0.0.1 port
  "https://misha-vynnyk.github.io",
];

// Add origin from environment variable if set
if (process.env.ALLOWED_ORIGIN) {
  allowedOrigins.push(process.env.ALLOWED_ORIGIN);
}

// In production, allow all GitHub Pages origins for this user
if (process.env.NODE_ENV === "production") {
  allowedOrigins.push("https://misha-vynnyk.github.io");
  // Also allow wildcard for any path on GitHub Pages
  allowedOrigins.push(/^https:\/\/misha-vynnyk\.github\.io/);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (typeof allowedOrigin === "string") {
        return origin === allowedOrigin || origin.startsWith(allowedOrigin);
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/blocks", require("./routes/blockFiles"));
app.use("/api/templates", require("./routes/templates"));
app.use("/api/custom-blocks", require("./routes/customBlocks"));
app.use("/api/image-converter", require("./routes/imageConverter"));
app.use("/api/storage-paths", require("./routes/storagePaths"));
app.use(require("./routes/storageUpload"));
app.use("/api", require("./routes/email"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Helper function to find an available port
const findAvailablePort = async (startPort, maxAttempts = 10) => {
  const net = require("net");

  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const isAvailable = await new Promise((resolve) => {
      const server = net.createServer();

      server.once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(false);
        } else {
          resolve(false);
        }
      });

      server.once("listening", () => {
        server.close();
        resolve(true);
      });

      server.listen(port);
    });

    if (isAvailable) {
      if (i > 0) {
        console.log(`⚠️  Port ${startPort} is in use, using port ${port} instead`);
      }
      return port;
    }
  }

  throw new Error(`Could not find an available port after ${maxAttempts} attempts starting from ${startPort}`);
};

// Start server with automatic port detection
const startServer = async () => {
  try {
    const initialPort = parseInt(process.env.PORT) || 3001;
    const availablePort = await findAvailablePort(initialPort);

    app.listen(availablePort, () => {
      console.log(`🚀 Server running on port ${availablePort}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 CORS enabled for: ${allowedOrigins.join(", ")}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Graceful error handling
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
startServer();
