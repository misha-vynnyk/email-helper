import { Email } from "@mui/icons-material";
import { motion } from "framer-motion";

import { useRegistrationStatus } from "../../hooks/useRegistrationStatus";
import { ThemeToggle } from "../../themes/modern";

interface ModernHeaderProps {
  onRegistrationClick?: () => void;
}

export default function ModernHeader({ onRegistrationClick }: ModernHeaderProps) {
  const { isRegistered, hasValidCredentials } = useRegistrationStatus();

  const getRegistrationButtonText = () => {
    if (!isRegistered) return "Setup Email";
    if (!hasValidCredentials) return "Fix Email Setup";
    return "Email Settings";
  };

  return (
    <header className="header">
      <div className="header-left">
        <motion.a
          href="#empty"
          className="logo"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = "#empty";
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Email style={{ color: 'var(--purple-primary)' }} />
          <span>EmailBuilder.js</span>
        </motion.a>
      </div>

      <div className="header-right">
        {onRegistrationClick && (
          <button
            className={`btn btn-text ${!hasValidCredentials && isRegistered ? 'badge badge-warning' : ''}`}
            onClick={onRegistrationClick}
          >
            {getRegistrationButtonText()}
          </button>
        )}

        <ThemeToggle showTypeToggle />

        <a
          href="https://www.usewaypoint.com/open-source/emailbuilderjs"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-text"
        >
          Learn More
        </a>

        <a
          href="https://github.com/usewaypoint/email-builder-js"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
