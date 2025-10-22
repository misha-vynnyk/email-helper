const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

/**
 * POST /api/send-email
 * Send test email
 */
router.post("/send-email", async (req, res) => {
  try {
    const { to, subject, html, smtp } = req.body;

    // Validation
    if (!to || !subject || !html) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, html",
      });
    }

    if (!smtp || !smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
      return res.status(400).json({
        error: "Missing SMTP configuration",
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: parseInt(smtp.port),
      secure: smtp.secure !== false, // true for 465, false for other ports
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    // Verify connection
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: smtp.user,
      to,
      subject,
      html,
    });

    res.json({
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    res.status(500).json({
      error: "Failed to send email",
      message: error.message,
    });
  }
});

/**
 * POST /api/verify-smtp
 * Verify SMTP credentials
 */
router.post("/verify-smtp", async (req, res) => {
  try {
    const { smtp } = req.body;

    if (!smtp || !smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
      return res.status(400).json({
        error: "Missing SMTP configuration",
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: parseInt(smtp.port),
      secure: smtp.secure !== false,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.verify();

    res.json({
      success: true,
      message: "SMTP credentials verified successfully",
    });
  } catch (error) {
    console.error("SMTP verification failed:", error);
    res.status(400).json({
      error: "SMTP verification failed",
      message: error.message,
    });
  }
});

module.exports = router;

