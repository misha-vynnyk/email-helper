const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

/**
 * POST /api/send-email
 * Send test email
 */
router.post("/send-email", async (req, res) => {
  try {
    const { userEmail, subject, html, senderEmail, appPassword } = req.body;

    // Validation
    if (!userEmail || !subject || !html) {
      return res.status(400).json({
        error: "Missing required fields: userEmail, subject, html",
      });
    }

    if (!senderEmail || !appPassword) {
      return res.status(400).json({
        error: "Missing email credentials: senderEmail, appPassword",
      });
    }

    // Determine SMTP settings based on sender email domain
    const emailDomain = senderEmail.split("@")[1]?.toLowerCase();
    let smtpConfig = {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
    };

    // Support for different email providers
    if (emailDomain?.includes("outlook") || emailDomain?.includes("hotmail")) {
      smtpConfig = {
        host: "smtp.office365.com",
        port: 587,
        secure: false,
      };
    } else if (emailDomain?.includes("yahoo")) {
      smtpConfig = {
        host: "smtp.mail.yahoo.com",
        port: 465,
        secure: true,
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      ...smtpConfig,
      auth: {
        user: senderEmail,
        pass: appPassword,
      },
    });

    // Verify connection
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: senderEmail,
      to: userEmail,
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

