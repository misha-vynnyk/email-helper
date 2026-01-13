import { Edit, SettingsApplications, Storage } from "@mui/icons-material";
import { motion } from "framer-motion";

import { useEmailSender } from "../../../emailSender/EmailSenderContext";

export default function ModernStorageToggle() {
  const { useStorageToggle, setUseStorageToggle } = useEmailSender();

  const options = [
    {
      value: "localStorage" as const,
      label: "LocalStorage",
      icon: <Storage fontSize="small" />,
      description: "Credentials are automatically saved and loaded from browser localStorage",
      alertType: "info" as const,
    },
    {
      value: "env" as const,
      label: ".env File",
      icon: <SettingsApplications fontSize="small" />,
      description: "Credentials are loaded from environment variables (.env file)",
      alertType: "warning" as const,
    },
    {
      value: "state" as const,
      label: "Manual Entry",
      icon: <Edit fontSize="small" />,
      description: "Credentials are entered manually and stored only in component state",
      alertType: "success" as const,
    },
  ];

  const selectedOption = options.find((opt) => opt.value === useStorageToggle) || options[0];

  return (
    <div className="card" style={{ padding: "16px", marginBottom: "12px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{
          margin: 0,
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px"
        }}>
          <SettingsApplications style={{ color: "var(--purple-primary)" }} />
          Credential Storage Method
        </h3>
      </div>

      <div className="storage-toggle-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        marginBottom: "20px"
      }}>
        {options.map((option) => (
          <motion.button
            key={option.value}
            className={`btn ${useStorageToggle === option.value ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setUseStorageToggle(option.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 500,
              backgroundColor: useStorageToggle === option.value
                ? "var(--purple-primary)"
                : "var(--bg-primary)",
              color: useStorageToggle === option.value ? "#FFFFFF" : "var(--text-primary)",
              border: `1px solid ${useStorageToggle === option.value ? "var(--purple-primary)" : "var(--border-color)"}`,
            }}
          >
            {option.icon}
            <span>{option.label}</span>
          </motion.button>
        ))}
      </div>

      <div className={`alert alert-${selectedOption.alertType}`}>
        <span>ℹ️</span>
        <div>{selectedOption.description}</div>
      </div>

      {useStorageToggle === "env" && (
        <div className="alert alert-warning" style={{ marginTop: "16px" }}>
          <span>⚠️</span>
          <div>
            <strong>Environment variables setup:</strong>
            <br />
            Create a <code style={{
              backgroundColor: "var(--bg-tertiary)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "monospace"
            }}>.env</code> file with:
            <br />
            <code style={{
              backgroundColor: "var(--bg-tertiary)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "monospace",
              display: "block",
              marginTop: "8px"
            }}>
              VITE_EMAIL_USER=your-email@gmail.com<br />
              VITE_DESTINATION_EMAIL_USER=recipient@example.com<br />
              VITE_EMAIL_PASS=your-app-password
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
