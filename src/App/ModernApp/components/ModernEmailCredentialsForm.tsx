import { AccountCircle, Email, ExpandLess, ExpandMore, Security, Visibility, VisibilityOff } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import { useEmailSender } from "../../../emailSender/EmailSenderContext";
import ModernStorageToggle from "./ModernStorageToggle";

export default function ModernEmailCredentialsForm() {
  const {
    userEmail,
    setUserEmail,
    senderEmail,
    setSenderEmail,
    appPassword,
    setAppPassword,
    areCredentialsValid,
    serverStatus,
    useStorageToggle,
  } = useEmailSender();

  const [showPassword, setShowPassword] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem("emailCredentialsExpanded");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return useStorageToggle !== "state";
  });

  useEffect(() => {
    localStorage.setItem("emailCredentialsExpanded", JSON.stringify(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    if (useStorageToggle === "state") {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [useStorageToggle]);

  const getServerStatus = () => {
    switch (serverStatus) {
      case "online":
        return { label: "Server Online", class: "badge-success" };
      case "offline":
        return { label: "Server Offline", class: "badge-error" };
      default:
        return { label: "Checking...", class: "badge-neutral" };
    }
  };

  const status = getServerStatus();

  return (
    <div className="modern-form-section">
      <ModernStorageToggle />

      <div className="card" style={{ marginTop: "24px" }}>
        <div
          className="collapsible-header"
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <div className="collapsible-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>📧</span>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
              Email Configuration
            </h3>
          </div>
          <div className="collapsible-header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className={`badge ${status.class}`}>{status.label}</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="collapsible-content expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {!areCredentialsValid && (
                <div className="alert alert-info">
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>ℹ️</span>
                  <div>
                    <strong>Setup Required:</strong> Please configure your email credentials to send emails.
                    Use Gmail app passwords for authentication.
                  </div>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <AccountCircle style={{ marginRight: "8px", verticalAlign: "middle" }} />
                    Your Email (Gmail)
                  </label>
                  <div className="input-wrapper">
                    <AccountCircle className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div className="form-help-text">
                    The Gmail account you'll send emails from
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Email style={{ marginRight: "8px", verticalAlign: "middle" }} />
                    Recipient Email
                  </label>
                  <div className="input-wrapper">
                    <Email className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div className="form-help-text">
                    The email address that will receive the template
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Security style={{ marginRight: "8px", verticalAlign: "middle" }} />
                    Gmail App Password
                  </label>
                  <div className="input-wrapper icon-right">
                    <Security className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      value={appPassword}
                      onChange={(e) => setAppPassword(e.target.value)}
                      placeholder="16-character app password"
                    />
                    <button
                      type="button"
                      className="input-icon-button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-tertiary)",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </button>
                  </div>
                  <div className="form-help-text">
                    Generate app password at: Google Account → Security → 2-Step Verification → App passwords
                  </div>
                </div>

                <div className="alert alert-warning" style={{ marginTop: "0" }}>
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>⚠️</span>
                  <div>
                    <strong>Important:</strong> Use Gmail App Passwords, not your regular password.
                    Generate one at: Google Account → Security → 2-Step Verification → App passwords
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
