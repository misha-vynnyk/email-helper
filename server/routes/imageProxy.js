/**
 * Image Proxy Route
 * Proxies external image requests to bypass browser CORS restrictions.
 * The AI analyzer needs to fetch images that external servers don't expose
 * with CORS headers. This server-side proxy fetches them without CORS limits.
 */
const express = require("express");
const router = express.Router();

router.get("/api/image-proxy", async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing ?url= parameter" });
  }

  // Validate it's an http/https URL (security: prevent SSRF to internal services)
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: "Only http/https URLs are allowed" });
  }

  // Block requests to localhost/private IPs to prevent SSRF
  const hostname = parsedUrl.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.")) {
    return res.status(403).json({ error: "Private/internal URLs are not allowed" });
  }

  try {
    const fetch = globalThis.fetch || (await import("node-fetch").then((m) => m.default));
    const upstream = await fetch(url, {
      headers: {
        // Mimic a browser to avoid bot-blocking
        "User-Agent": "Mozilla/5.0 (compatible; EmailHelperBot/1.0)",
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream error: ${upstream.statusText}` });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    // Only allow image content types
    if (!contentType.startsWith("image/")) {
      return res.status(415).json({ error: "URL does not point to an image" });
    }

    // Stream response with appropriate headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Image proxy error:", err.message);
    res.status(502).json({ error: `Failed to fetch image: ${err.message}` });
  }
});

module.exports = router;
