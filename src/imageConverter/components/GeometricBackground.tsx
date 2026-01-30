/**
 * Futuristic Animated Background
 * With moving elements, grid, and sci-fi aesthetic
 */

import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useThemeMode } from "../../theme";

export default function GeometricBackground() {
  const theme = useTheme();
  const { style } = useThemeMode();
  const isDark = theme.palette.mode === "dark";

  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  const baseOpacity = isDark ? 0.15 : 0.08;
  const midOpacity = isDark ? 0.12 : 0.06;
  const lightOpacity = isDark ? 0.08 : 0.04;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        zIndex: 0,
        pointerEvents: "none",
        "@keyframes rotateGrid": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.1)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        "@keyframes pulse": {
          "0%, 100%": { opacity: 0.3 },
          "50%": { opacity: 0.6 },
        },
        "@keyframes slideRight": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "@keyframes slideDown": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(200%)" },
        },
        "@keyframes float": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(30px, -30px)" },
        },
        "@keyframes float2": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-25px, 25px)" },
        },
        "@keyframes morphShape": {
          "0%, 100%": { clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 80%)" },
          "50%": { clipPath: "polygon(0 0, 100% 10%, 90% 100%, 0 85%)" },
        },
        "@keyframes morphShape2": {
          "0%, 100%": { clipPath: "polygon(30% 0, 100% 0, 100% 100%, 15% 100%)" },
          "50%": { clipPath: "polygon(25% 0, 100% 5%, 100% 95%, 20% 100%)" },
        },
        "@keyframes scan": {
          "0%": { transform: "translateY(-100%)", opacity: 0 },
          "10%": { opacity: 0.8 },
          "90%": { opacity: 0.8 },
          "100%": { transform: "translateY(100%)", opacity: 0 },
        },
      }}
    >
      {/* Textured background overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            0deg,
            ${alpha(theme.palette.background.paper, 0.03)} 0px,
            transparent 1px,
            transparent 2px,
            ${alpha(theme.palette.background.paper, 0.03)} 3px
          )`,
          opacity: 0.5,
        }}
      />

      {/* Animated grid pattern */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "200%",
          height: "200%",
          transform: "translate(-50%, -50%)",
          backgroundImage: `
            linear-gradient(${alpha(primaryColor, isDark ? 0.06 : 0.03)} 1px, transparent 1px),
            linear-gradient(90deg, ${alpha(primaryColor, isDark ? 0.06 : 0.03)} 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          animation: "rotateGrid 60s linear infinite",
        }}
      />

      {/* Left vertical neon bar (cyan/blue-green) */}
      <Box
        sx={{
          position: "absolute",
          left: "5%",
          top: "10%",
          bottom: "10%",
          width: "3px",
          background: `linear-gradient(180deg,
            transparent 0%,
            ${alpha(primaryColor, 0.8)} 10%,
            ${primaryColor} 50%,
            ${alpha(primaryColor, 0.8)} 90%,
            transparent 100%)`,
          boxShadow: `
            0 0 20px ${alpha(primaryColor, 0.6)},
            0 0 40px ${alpha(primaryColor, 0.4)},
            0 0 60px ${alpha(primaryColor, 0.2)}
          `,
          animation: "pulse 4s ease-in-out infinite",
          zIndex: 2,
        }}
      />

      {/* Left neon glow spread */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "15%",
          background: `linear-gradient(90deg,
            ${alpha(primaryColor, isDark ? 0.15 : 0.08)} 0%,
            ${alpha(primaryColor, isDark ? 0.08 : 0.04)} 50%,
            transparent 100%)`,
          filter: "blur(30px)",
          zIndex: 1,
        }}
      />

      {/* Right vertical neon bar (magenta/pink) */}
      <Box
        sx={{
          position: "absolute",
          right: "5%",
          top: "10%",
          bottom: "10%",
          width: "3px",
          background: `linear-gradient(180deg,
            transparent 0%,
            ${alpha(secondaryColor, 0.8)} 10%,
            ${secondaryColor} 50%,
            ${alpha(secondaryColor, 0.8)} 90%,
            transparent 100%)`,
          boxShadow: `
            0 0 20px ${alpha(secondaryColor, 0.6)},
            0 0 40px ${alpha(secondaryColor, 0.4)},
            0 0 60px ${alpha(secondaryColor, 0.2)}
          `,
          animation: "pulse 4s ease-in-out infinite",
          animationDelay: "2s",
          zIndex: 2,
        }}
      />

      {/* Right neon glow spread */}
      <Box
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "15%",
          background: `linear-gradient(270deg,
            ${alpha(secondaryColor, isDark ? 0.15 : 0.08)} 0%,
            ${alpha(secondaryColor, isDark ? 0.08 : 0.04)} 50%,
            transparent 100%)`,
          filter: "blur(30px)",
          zIndex: 1,
        }}
      />

      {/* Animated panel 1 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "60%",
          height: "50%",
          background: `linear-gradient(135deg,
            ${alpha(primaryColor, baseOpacity)} 0%,
            ${alpha(primaryColor, lightOpacity)} 100%)`,
          animation: "morphShape 8s ease-in-out infinite",
        }}
      />

      {/* Animated panel 2 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "60%",
          background: `linear-gradient(225deg,
            ${alpha(secondaryColor, midOpacity)} 0%,
            ${alpha(secondaryColor, lightOpacity)} 100%)`,
          animation: "morphShape2 10s ease-in-out infinite",
        }}
      />

      {/* Moving scan line effect */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg,
            transparent 0%,
            ${alpha(primaryColor, 0.8)} 50%,
            transparent 100%)`,
          boxShadow: `0 0 20px ${alpha(primaryColor, 0.6)}`,
          animation: "scan 4s ease-in-out infinite",
        }}
      />

      {/* Horizontal moving lines */}
      {[0, 1, 2].map((i) => (
        <Box
          key={`h-line-${i}`}
          sx={{
            position: "absolute",
            top: `${20 + i * 30}%`,
            left: 0,
            width: "100%",
            height: "1px",
            background: `linear-gradient(90deg,
              transparent 0%,
              ${alpha(primaryColor, isDark ? 0.2 : 0.1)} 50%,
              transparent 100%)`,
            animation: `pulse ${3 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Floating particles/dots */}
      {[...Array(8)].map((_, i) => (
        <Box
          key={`particle-${i}`}
          sx={{
            position: "absolute",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${4 + Math.random() * 6}px`,
            height: `${4 + Math.random() * 6}px`,
            borderRadius: "50%",
            background: i % 2 === 0 ? primaryColor : secondaryColor,
            opacity: isDark ? 0.4 : 0.2,
            animation: `float ${10 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            boxShadow: `0 0 10px ${alpha(i % 2 === 0 ? primaryColor : secondaryColor, 0.6)}`,
          }}
        />
      ))}

      {/* Hexagon shapes */}
      <Box
        sx={{
          position: "absolute",
          top: "15%",
          right: "20%",
          width: "80px",
          height: "80px",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          border: `1px solid ${alpha(primaryColor, isDark ? 0.3 : 0.15)}`,
          animation: "rotateGrid 20s linear infinite",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "20%",
          left: "15%",
          width: "60px",
          height: "60px",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          border: `1px solid ${alpha(secondaryColor, isDark ? 0.3 : 0.15)}`,
          animation: "rotateGrid 15s linear infinite reverse",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: "60%",
          right: "35%",
          width: "50px",
          height: "50px",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          border: `1px solid ${alpha(primaryColor, isDark ? 0.25 : 0.12)}`,
          animation: "rotateGrid 12s linear infinite",
        }}
      />

      {/* Triangle shapes */}
      <Box
        sx={{
          position: "absolute",
          top: "25%",
          left: "10%",
          width: 0,
          height: 0,
          borderLeft: "30px solid transparent",
          borderRight: "30px solid transparent",
          borderBottom: `52px solid ${alpha(primaryColor, isDark ? 0.2 : 0.1)}`,
          animation: "rotateGrid 18s linear infinite",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "30%",
          right: "25%",
          width: 0,
          height: 0,
          borderLeft: "25px solid transparent",
          borderRight: "25px solid transparent",
          borderTop: `43px solid ${alpha(secondaryColor, isDark ? 0.2 : 0.1)}`,
          animation: "rotateGrid 22s linear infinite reverse",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: "45%",
          left: "35%",
          width: 0,
          height: 0,
          borderLeft: "20px solid transparent",
          borderRight: "20px solid transparent",
          borderBottom: `35px solid ${alpha(primaryColor, isDark ? 0.15 : 0.08)}`,
          animation: "float 14s ease-in-out infinite",
        }}
      />

      {/* Square/Rectangle shapes */}
      <Box
        sx={{
          position: "absolute",
          top: "40%",
          right: "15%",
          width: "70px",
          height: "70px",
          border: `2px solid ${alpha(primaryColor, isDark ? 0.3 : 0.15)}`,
          animation: "rotateGrid 25s linear infinite",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "45%",
          left: "25%",
          width: "50px",
          height: "50px",
          border: `1px solid ${alpha(secondaryColor, isDark ? 0.25 : 0.12)}`,
          animation: "rotateGrid 16s linear infinite reverse",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: "55%",
          left: "60%",
          width: "40px",
          height: "60px",
          border: `1px solid ${alpha(primaryColor, isDark ? 0.2 : 0.1)}`,
          animation: "float2 20s ease-in-out infinite",
        }}
      />

      {/* Pentagon shapes */}
      <Box
        sx={{
          position: "absolute",
          top: "70%",
          right: "40%",
          width: "55px",
          height: "55px",
          clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
          border: `1px solid ${alpha(secondaryColor, isDark ? 0.3 : 0.15)}`,
          animation: "rotateGrid 19s linear infinite",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "45%",
          width: "45px",
          height: "45px",
          clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
          border: `1px solid ${alpha(primaryColor, isDark ? 0.25 : 0.12)}`,
          animation: "rotateGrid 17s linear infinite reverse",
        }}
      />

      {/* Octagon shapes */}
      <Box
        sx={{
          position: "absolute",
          bottom: "35%",
          left: "55%",
          width: "65px",
          height: "65px",
          clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          border: `1px solid ${alpha(primaryColor, isDark ? 0.3 : 0.15)}`,
          animation: "rotateGrid 21s linear infinite",
        }}
      />

      {/* Diamond shapes */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          right: "8%",
          width: "45px",
          height: "45px",
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          border: `1px solid ${alpha(secondaryColor, isDark ? 0.25 : 0.12)}`,
          animation: "float 13s ease-in-out infinite",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "15%",
          left: "40%",
          width: "35px",
          height: "35px",
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          background: `linear-gradient(135deg,
            ${alpha(primaryColor, isDark ? 0.15 : 0.08)} 0%,
            transparent 100%)`,
          animation: "rotateGrid 14s linear infinite reverse",
        }}
      />

      {/* Star-like shapes (complex polygons) */}
      <Box
        sx={{
          position: "absolute",
          top: "35%",
          left: "70%",
          width: "40px",
          height: "40px",
          clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          border: `1px solid ${alpha(primaryColor, isDark ? 0.25 : 0.12)}`,
          animation: "rotateGrid 24s linear infinite",
        }}
      />

      {/* Circles with borders */}
      <Box
        sx={{
          position: "absolute",
          top: "20%",
          left: "55%",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: `1px solid ${alpha(secondaryColor, isDark ? 0.3 : 0.15)}`,
          animation: "pulse 4s ease-in-out infinite",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "50%",
          right: "45%",
          width: "45px",
          height: "45px",
          borderRadius: "50%",
          border: `2px solid ${alpha(primaryColor, isDark ? 0.25 : 0.12)}`,
          animation: "pulse 3.5s ease-in-out infinite",
          animationDelay: "1s",
        }}
      />

      {/* Large glowing orbs */}
      <Box
        sx={{
          position: "absolute",
          top: "30%",
          left: "20%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(circle,
            ${alpha(primaryColor, isDark ? 0.25 : 0.12)} 0%,
            transparent 70%)`,
          filter: "blur(40px)",
          animation: "float 15s ease-in-out infinite",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "25%",
          right: "15%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: `radial-gradient(circle,
            ${alpha(secondaryColor, isDark ? 0.25 : 0.12)} 0%,
            transparent 70%)`,
          filter: "blur(50px)",
          animation: "float2 18s ease-in-out infinite",
        }}
      />

      {/* Diagonal moving gradient strip */}
      <Box
        sx={{
          position: "absolute",
          top: "30%",
          left: 0,
          width: "100%",
          height: "2px",
          background: `linear-gradient(90deg,
            transparent 0%,
            ${alpha(secondaryColor, 0.5)} 50%,
            transparent 100%)`,
          transform: "rotate(-15deg)",
          transformOrigin: "center",
          animation: "slideRight 8s linear infinite",
        }}
      />

      {/* Corner accent elements */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100px",
          height: "100px",
          borderTop: `2px solid ${alpha(primaryColor, isDark ? 0.4 : 0.2)}`,
          borderLeft: `2px solid ${alpha(primaryColor, isDark ? 0.4 : 0.2)}`,
          animation: "pulse 3s ease-in-out infinite",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "100px",
          height: "100px",
          borderBottom: `2px solid ${alpha(secondaryColor, isDark ? 0.4 : 0.2)}`,
          borderRight: `2px solid ${alpha(secondaryColor, isDark ? 0.4 : 0.2)}`,
          animation: "pulse 3s ease-in-out infinite",
          animationDelay: "1.5s",
        }}
      />
    </Box>
  );
}
