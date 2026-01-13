// Using @mui/icons-material instead of lucide-react
import { Menu, Monitor, PhoneIphone } from "@mui/icons-material";
import { motion } from "framer-motion";

import { BlockLibrary } from "../../blockLibrary";
import {
  setSelectedMainTab,
  setSelectedScreenSize,
  toggleSamplesDrawerOpen,
  useSelectedMainTab,
  useSelectedScreenSize,
  useSamplesDrawerOpen,
} from "../../contexts/AppState";
import { EmailSenderProvider } from "../../emailSender/EmailSenderContext";
import { ImageConverterPanel } from "../../imageConverter";
import { TemplateLibrary } from "../../templateLibrary";

import ModernEmailSenderPanel from "./components/ModernEmailSenderPanel";
import ModernPanelWrapper from "./components/ModernPanelWrapper";

const TABS = [
  { id: "email", label: "Email" },
  { id: "blocks", label: "Blocks" },
  { id: "templates", label: "Templates" },
  { id: "images", label: "Images" },
] as const;

export default function ModernTemplatePanel() {
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();
  const samplesDrawerOpen = useSamplesDrawerOpen();

  const handleScreenSizeChange = (value: "mobile" | "desktop") => {
    setSelectedScreenSize(value);
  };

  const renderMainPanel = () => {
    switch (selectedMainTab) {
      case "email":
        return <ModernEmailSenderPanel />;
      case "blocks":
        return (
          <ModernPanelWrapper>
            <BlockLibrary />
          </ModernPanelWrapper>
        );
      case "templates":
        return (
          <ModernPanelWrapper>
            <EmailSenderProvider>
              <TemplateLibrary />
            </EmailSenderProvider>
          </ModernPanelWrapper>
        );
      case "images":
        return (
          <ModernPanelWrapper>
            <ImageConverterPanel />
          </ModernPanelWrapper>
        );
      default:
        return <ModernEmailSenderPanel />;
    }
  };

  const mainContentStyle: React.CSSProperties =
    selectedScreenSize === "mobile"
      ? {
          margin: "32px auto",
          width: 370,
          height: 800,
          boxShadow: "var(--shadow-xl)",
          borderRadius: "12px",
          overflow: "hidden",
        }
      : {
          height: "100%",
        };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
      {/* Modern Toolbar */}
      <div
        style={{
          height: "56px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-primary)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <motion.button
            className="btn btn-text"
            onClick={() => toggleSamplesDrawerOpen()}
            style={{ minWidth: "auto", padding: "8px" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Menu fontSize="small" />
          </motion.button>

          <div className="tabs" style={{ borderBottom: "none", gap: "4px" }}>
            {TABS.map((tab) => (
              <motion.button
                key={tab.id}
                className={`tab ${selectedMainTab === tab.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedMainTab(tab.id as "email" | "blocks" | "templates" | "images");
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "4px",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "8px",
            }}
          >
            <motion.button
              className={`btn btn-text ${selectedScreenSize === "desktop" ? "active" : ""}`}
              onClick={() => handleScreenSizeChange("desktop")}
              style={{
                minWidth: "auto",
                padding: "6px 12px",
                backgroundColor: selectedScreenSize === "desktop" ? "var(--purple-primary)" : "transparent",
                color: selectedScreenSize === "desktop" ? "#FFFFFF" : "var(--text-primary)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Monitor fontSize="small" />
            </motion.button>
            <motion.button
              className={`btn btn-text ${selectedScreenSize === "mobile" ? "active" : ""}`}
              onClick={() => handleScreenSizeChange("mobile")}
              style={{
                minWidth: "auto",
                padding: "6px 12px",
                backgroundColor: selectedScreenSize === "mobile" ? "var(--purple-primary)" : "transparent",
                color: selectedScreenSize === "mobile" ? "#FFFFFF" : "var(--text-primary)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PhoneIphone fontSize="small" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={mainContentStyle}>{renderMainPanel()}</div>
      </div>
    </div>
  );
}
