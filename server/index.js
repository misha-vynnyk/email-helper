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
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3000", "https://misha-vynnyk.github.io"],
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

// Graceful error handling
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
});
