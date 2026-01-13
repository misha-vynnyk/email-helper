import React, { Suspense } from "react";
import { motion } from "framer-motion";

import { EmailSenderProvider } from "../../../emailSender/EmailSenderContext";
import ModernEmailCredentialsForm from "./ModernEmailCredentialsForm";
import ModernEmailHtmlEditor from "./ModernEmailHtmlEditor";

function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '48px',
      gap: '12px'
    }}>
      <div
        className="spinner"
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--purple-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        Loading email components...
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function EmailSenderPanelContent() {
  return (
    <div className="modern-email-sender-panel" style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      backgroundColor: "var(--bg-primary)"
    }}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="email-sender-header"
        style={{
          padding: "12px 16px 10px 16px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <div className="email-sender-header-content" style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "8px"
        }}>
          <div className="header-icon" style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            backgroundColor: "var(--purple-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
          }}>
            📧
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.2
            }}>
              Email Sender
            </h1>
            <p style={{
              margin: "4px 0 0 0",
              fontSize: "14px",
              color: "var(--text-secondary)"
            }}>
              Configure and send email templates
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content Section with Scroll */}
      <div className="email-sender-content" style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ModernEmailCredentialsForm />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{ flex: 1 }}
        >
          <ModernEmailHtmlEditor />
        </motion.div>
      </div>
    </div>
  );
}

export default function ModernEmailSenderPanel() {
  return (
    <EmailSenderProvider>
      <EmailSenderPanelContent />
    </EmailSenderProvider>
  );
}
