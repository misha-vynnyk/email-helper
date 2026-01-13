import { Email, Settings } from "@mui/icons-material";
import { motion } from "framer-motion";

import { useSamplesDrawerOpen } from "../../contexts/AppState";
import { useRegistrationStatus } from "../../hooks/useRegistrationStatus";
import { ThemeToggle } from "../../themes/modern";

interface ModernSidebarProps {
  open: boolean;
  onSettingsOpen?: () => void;
  onRegistrationOpen?: () => void;
}

const SIDEBAR_ITEMS = [
  { href: "#empty", label: "Empty" },
  { href: "#sample/welcome", label: "Welcome email" },
  { href: "#sample/one-time-password", label: "One-time passcode (OTP)" },
  { href: "#sample/reset-password", label: "Reset password" },
  { href: "#sample/order-ecomerce", label: "E-commerce receipt" },
  { href: "#sample/subscription-receipt", label: "Subscription receipt" },
  { href: "#sample/reservation-reminder", label: "Reservation reminder" },
  { href: "#sample/post-metrics-report", label: "Post metrics" },
  { href: "#sample/respond-to-message", label: "Respond to inquiry" },
];

export default function ModernSidebar({ open, onSettingsOpen, onRegistrationOpen }: ModernSidebarProps) {
  const { isRegistered, hasValidCredentials } = useRegistrationStatus();
  const currentHash = typeof window !== 'undefined' ? window.location.hash : '';

  const handleEmailSettingsClick = () => {
    if (isRegistered) {
      onSettingsOpen?.();
    } else {
      onRegistrationOpen?.();
    }
  };

  return (
    <aside className={`sidebar ${!open ? 'sidebar-hidden' : ''}`}>
      <div className="sidebar-header">
        <motion.a
          href="#empty"
          className="logo"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = "#empty";
          }}
          style={{ color: 'var(--sidebar-text)', textDecoration: 'none', fontWeight: 600 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          EmailBuilder.js
        </motion.a>

        <motion.button
          className="btn btn-text"
          onClick={handleEmailSettingsClick}
          style={{
            color: 'var(--sidebar-text)',
            padding: '4px',
            minWidth: 'auto',
            background: !hasValidCredentials && isRegistered ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isRegistered ? <Settings fontSize="small" /> : <Email fontSize="small" />}
        </motion.button>
      </div>

      <div className="sidebar-content">
        <nav>
          {SIDEBAR_ITEMS.map((item) => (
            <motion.a
              key={item.href}
              href={item.href}
              className={`sidebar-item ${currentHash === item.href ? 'active' : ''}`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.label}
            </motion.a>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--sidebar-text)', opacity: 0.7 }}>Theme</span>
          <ThemeToggle showTypeToggle />
        </div>

        <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <a
            href="https://usewaypoint.com?utm_source=emailbuilderjs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--sidebar-text)', opacity: 0.7 }}
          >
            Looking to send emails?
          </a>
          <p style={{ fontSize: '11px', color: 'var(--sidebar-text)', opacity: 0.6, marginBottom: '12px', lineHeight: 1.5 }}>
            Waypoint is an end-to-end email API with a 'pro' version of this template builder.
          </p>
          <a
            href="https://usewaypoint.com?utm_source=emailbuilderjs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '12px', padding: '8px' }}
          >
            Learn more
          </a>
        </div>
      </div>
    </aside>
  );
}
