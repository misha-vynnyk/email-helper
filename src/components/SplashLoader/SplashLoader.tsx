import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "../../lib/utils";

interface SplashLoaderProps {
  onComplete: () => void;
  duration?: number;
  statusMessage?: string;
  isError?: boolean;
}

const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete, duration = 2500, statusMessage, isError = false }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration === 0) {
      // Don't auto-complete for error state
      return;
    }

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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className='fixed inset-0 z-[9999] flex items-center justify-center bg-background'>
          {/* Subtle background pattern */}
          <div
            className='absolute inset-0 opacity-50'
            style={{
              background:
                "radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, hsl(var(--primary) / 0.06) 0%, transparent 50%)",
            }}
          />

          {/* Main content */}
          <div className='relative text-center'>
            {/* Logo icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.1,
              }}>
              <div className='flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-[20px] bg-gradient-to-br from-primary to-primary/60 shadow-lg'>
                <svg width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <rect x='2' y='4' width='20' height='16' rx='2' />
                  <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
                </svg>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
              <h1 className='mb-1 text-3xl font-semibold tracking-tight text-foreground'>FlexiBuilder</h1>
            </motion.div>

            {/* Subtitle */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}>
              <p className={cn("text-[0.7rem] font-medium uppercase tracking-wider", isError ? "text-destructive" : "text-muted-foreground")}>
                {statusMessage || "Email Template Builder"}
              </p>
            </motion.div>

            {/* Loading indicator */}
            {!isError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginTop: 40 }}>
                <div className='w-40 h-[3px] mx-auto overflow-hidden rounded-full bg-primary/15'>
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "easeInOut",
                    }}
                    className='w-2/5 h-full rounded-full'
                    style={{
                      background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashLoader;
