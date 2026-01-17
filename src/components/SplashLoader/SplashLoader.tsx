import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { alpha, Box, Typography, useTheme } from "@mui/material";

import { brandColors } from "../../theme/tokens";

interface SplashLoaderProps {
  onComplete: () => void;
  duration?: number;
}

const SplashLoader: React.FC<SplashLoaderProps> = ({
  onComplete,
  duration = 2500
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleExitComplete = () => {
    onComplete();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
        <Box
          component={motion.div}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "background.default",
          }}
        >
          {/* Subtle background pattern */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: 0.5,
              background: `radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%),
                           radial-gradient(circle at 80% 70%, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 50%)`,
            }}
          />

          {/* Main content */}
          <Box sx={{ position: "relative", textAlign: "center" }}>
            {/* Logo icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.1,
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  margin: "0 auto 24px",
                  background: `linear-gradient(135deg, ${brandColors.blue} 0%, ${brandColors.navy} 100%)`,
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: theme.shadows[4],
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </Box>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  letterSpacing: "-0.02em",
                  mb: 0.5,
                }}
              >
                FlexiBuilder
              </Typography>
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                }}
              >
                Email Template Builder
              </Typography>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ marginTop: 40 }}
            >
              <Box
                sx={{
                  width: 160,
                  height: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  borderRadius: 2,
                  margin: "0 auto",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: "40%",
                    height: "100%",
                    background: `linear-gradient(90deg, transparent, ${brandColors.blue}, transparent)`,
                    borderRadius: 2,
                  }}
                />
              </Box>
            </motion.div>
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default SplashLoader;
