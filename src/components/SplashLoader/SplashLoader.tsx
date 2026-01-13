import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography } from "@mui/material";

interface SplashLoaderProps {
  onComplete: () => void;
  duration?: number;
}

const SplashLoader: React.FC<SplashLoaderProps> = ({
  onComplete,
  duration = 2500
}) => {
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
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
            overflow: "hidden",
          }}
        >
          {/* Animated background particles */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                width: "300px",
                height: "300px",
                borderRadius: "50%",
                filter: "blur(80px)",
                opacity: 0.4,
              },
              "&::before": {
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                top: "-100px",
                left: "-100px",
                animation: "float1 6s ease-in-out infinite",
              },
              "&::after": {
                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                bottom: "-100px",
                right: "-100px",
                animation: "float2 6s ease-in-out infinite",
              },
              "@keyframes float1": {
                "0%, 100%": { transform: "translate(0, 0) scale(1)" },
                "50%": { transform: "translate(50px, 50px) scale(1.1)" },
              },
              "@keyframes float2": {
                "0%, 100%": { transform: "translate(0, 0) scale(1)" },
                "50%": { transform: "translate(-50px, -50px) scale(1.1)" },
              },
            }}
          />

          {/* Main content */}
          <Box sx={{ position: "relative", textAlign: "center" }}>
            {/* Logo icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  margin: "0 auto 32px",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  borderRadius: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 20px 60px rgba(59, 130, 246, 0.4)",
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: -3,
                    borderRadius: "27px",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)",
                    zIndex: -1,
                    opacity: 0.5,
                    filter: "blur(10px)",
                  },
                }}
              >
                <svg
                  width="50"
                  height="50"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                  mb: 1,
                }}
              >
                FlexiBuilder
              </Typography>
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: "#64748b",
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 400,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                }}
              >
                Email Template Builder
              </Typography>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ marginTop: 48 }}
            >
              <Box
                sx={{
                  width: 200,
                  height: 3,
                  background: "rgba(255,255,255,0.1)",
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
                    duration: 1.2,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: "50%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)",
                    borderRadius: 2,
                  }}
                />
              </Box>
            </motion.div>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashLoader;
