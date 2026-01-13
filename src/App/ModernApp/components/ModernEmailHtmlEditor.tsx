import { Clear, Code, Send } from "@mui/icons-material";
import { html } from "@codemirror/lang-html";
import CodeMirror from "@uiw/react-codemirror";
import { motion } from "framer-motion";
import { useState } from "react";

import EmailValidationPanel from "../../../emailValidator/EmailValidationPanel";
import { useEmailSender } from "../../../emailSender/EmailSenderContext";

export default function ModernEmailHtmlEditor() {
  const {
    editorHtml,
    setEditorHtml,
    subject,
    setSubject,
    loading,
    sendEmail,
    isReadyToSend,
    areCredentialsValid,
    serverStatus,
  } = useEmailSender();

  const isDisabled = loading || !isReadyToSend || !areCredentialsValid || serverStatus === "offline";

  const handleSend = () => {
    sendEmail();
  };

  const handleClearEditor = () => {
    setEditorHtml("");
  };

  return (
    <div className="modern-editor-section" style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "0 16px 16px 16px"
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="modern-editor-content"
        style={{ flex: 1, overflow: "auto", paddingRight: "8px" }}
      >
        <div className="editor-header" style={{
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-color)"
        }}>
          <Code style={{ color: "var(--purple-primary)" }} />
          <h2 style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 600,
            color: "var(--text-primary)"
          }}>
            Email Template Editor
          </h2>
        </div>

        {serverStatus === "offline" && (
          <div className="alert alert-error" style={{ marginBottom: "20px" }}>
            <span>❌</span>
            <div>
              <strong>Server Offline:</strong> Email server is offline. Please start the backend server.
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Subject Field */}
          <div className="form-group">
            <label className="form-label">Email Subject</label>
            <input
              type="text"
              className="form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
            <div className="form-help-text">
              A descriptive subject line for your email
            </div>
          </div>

          {/* Email Validation Panel */}
          <div className="card" style={{ padding: "16px" }}>
            <EmailValidationPanel
              html={editorHtml}
              onHtmlChange={setEditorHtml}
              showCompactView={false}
            />
          </div>

          {/* HTML Editor */}
          <div className="form-group">
            <label className="form-label">HTML Content</label>
            <div className="code-editor-wrapper" style={{
              border: "2px solid var(--border-color)",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "var(--shadow-md)",
              backgroundColor: "var(--bg-primary)",
            }}>
              <CodeMirror
                value={editorHtml}
                onChange={(value) => setEditorHtml(value)}
                height="500px"
                extensions={[html()]}
                theme={undefined}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  dropCursor: false,
                  allowMultipleSelections: false,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  highlightSelectionMatches: false,
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sticky Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="editor-action-bar"
        style={{
          position: "sticky",
          bottom: 0,
          backgroundColor: "var(--bg-primary)",
          borderTop: "1px solid var(--border-color)",
          padding: "12px 16px",
          margin: "16px -16px -16px -16px",
          boxShadow: "0px -4px 12px rgba(0, 0, 0, 0.08)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div className="action-bar-left" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <motion.button
            className="btn btn-outline"
            onClick={handleClearEditor}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Clear fontSize="small" />
            Clear Editor
          </motion.button>
        </div>

        <div className="action-bar-right" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {!areCredentialsValid && (
            <div className="alert alert-warning credentials-warning" style={{
              margin: 0,
              padding: "8px 16px",
              fontSize: "13px"
            }}>
              <span>⚠️</span>
              <span>Configure credentials first</span>
            </div>
          )}

          <motion.button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            style={{
              minWidth: "180px",
              height: "48px",
              fontSize: "16px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
              opacity: isDisabled ? 0.6 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
              backgroundColor: isDisabled ? "var(--bg-tertiary)" : "var(--status-success)",
            }}
          >
            <Send fontSize="small" />
            {loading ? "Sending..." : "Send Email"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
