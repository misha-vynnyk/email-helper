#!/usr/bin/env node

/**
 * Local Automation Server
 * Accepts upload requests from web app and executes Playwright automation
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const PORT = process.env.AUTOMATION_PORT || 3839;
const SCRIPT_PATH = path.join(__dirname, "scripts", "upload-playwright-brave.js");
const CONFIG_PATH = path.join(__dirname, "config.json");

// Load config
let config;
try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
} catch (err) {
  console.error("Failed to load config:", err);
  process.exit(1);
}

// Create temp directory for uploads
const TEMP_DIR = path.join(__dirname, "temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Cleanup temp files older than 1 hour
function cleanupTempFiles() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 3600000) {
        // 1 hour
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    // Ignore cleanup errors
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupTempFiles, 600000);

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", port: PORT }));
    return;
  }

  // Upload endpoint
  if (req.method === "POST" && req.url === "/upload") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { fileData, fileName, category, folderName, skipConfirmation } = data;

        if (!fileData || !fileName) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing fileData or fileName" }));
          return;
        }

        // Decode base64 file data
        const base64Data = fileData.replace(/^data:.*,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Save to temp file
        const tempFilePath = path.join(TEMP_DIR, `${Date.now()}-${fileName}`);
        fs.writeFileSync(tempFilePath, buffer);

        // Set clipboard content for folderName (script reads from clipboard)
        if (folderName) {
          const { execSync } = require("child_process");
          try {
            execSync(`echo "${folderName}" | pbcopy`, { encoding: "utf8" });
          } catch (err) {
            console.warn("Failed to set clipboard:", err.message);
          }
        }

        // Build command
        const args = [tempFilePath];
        if (category) {
          args.push(category);
        }
        if (skipConfirmation) {
          args.push("--no-confirm");
        }

        const command = `node ${SCRIPT_PATH} ${args.map((arg) => `"${arg}"`).join(" ")}`;

        // Execute script
        console.log(`Executing: ${command}`);
        const { stdout, stderr } = await execAsync(command, {
          cwd: __dirname,
          maxBuffer: 10 * 1024 * 1024, // 10MB
        });

        // Cleanup temp file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (err) {
          // Ignore cleanup errors
        }

        if (stderr && !stdout.includes("✅")) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: stderr || "Upload failed" }));
          return;
        }

        // Extract public URL from output if available
        const urlMatch = stdout.match(/https?:\/\/[^\s]+/);
        const publicUrl = urlMatch ? urlMatch[0] : null;

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "File uploaded successfully",
            url: publicUrl,
            output: stdout,
          })
        );
      } catch (err) {
        console.error("Upload error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Automation server running on http://127.0.0.1:${PORT}`);
  console.log(`📝 Ready to accept upload requests`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down automation server...");
  server.close(() => {
    console.log("✓ Server closed");
    process.exit(0);
  });
});
