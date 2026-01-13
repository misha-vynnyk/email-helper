import React from "react";
import { motion } from "framer-motion";

interface ModernPanelWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component for legacy panels to apply modern SCSS styles
 * This allows us to use existing logic while applying new styling
 * Використовуємо специфічні селектори замість !important
 */
export default function ModernPanelWrapper({ children, className = "" }: ModernPanelWrapperProps) {
  return (
    <motion.div
      className={`modern-panel-wrapper ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        height: "100%",
        overflow: "auto",
        backgroundColor: "var(--bg-primary)",
        padding: "16px",
      }}
    >
      {/* Apply modern theme styles to MUI components - використовуємо специфічні селектори */}
      <style>{`
        body.modern-theme-active .modern-panel-wrapper {
          /* Override MUI Paper styles - використовуємо подвійний клас для специфічності */
          .MuiPaper-root.MuiPaper-root {
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: var(--shadow-sm);
            color: var(--text-primary);
            padding: 16px;
          }

          /* Override MUI Typography with modern spacing */
          .MuiTypography-root.MuiTypography-root {
            color: var(--text-primary);
          }

          .MuiTypography-h1.MuiTypography-h1 {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.2;
            letter-spacing: -0.02em;
            margin-bottom: 8px;
            color: var(--text-primary);
          }

          .MuiTypography-h2.MuiTypography-h2 {
            font-size: 20px;
            font-weight: 700;
            line-height: 1.3;
            letter-spacing: -0.01em;
            margin-bottom: 8px;
            color: var(--text-primary);
          }

          .MuiTypography-h3.MuiTypography-h3 {
            font-size: 18px;
            font-weight: 600;
            line-height: 1.4;
            margin-bottom: 8px;
            color: var(--text-primary);
          }

          .MuiTypography-h4.MuiTypography-h4,
          .MuiTypography-h5.MuiTypography-h5,
          .MuiTypography-h6.MuiTypography-h6 {
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--text-primary);
          }

          .MuiTypography-body2.MuiTypography-body2,
          .MuiTypography-caption.MuiTypography-caption {
            color: var(--text-secondary);
          }

          /* Override MUI Button with modern spacing */
          .MuiButton-root.MuiButton-root {
            border-radius: 8px;
            text-transform: none;
            font-weight: 500;
            padding: 10px 20px;
            font-size: 14px;
            min-height: 40px;
            transition: all 0.2s ease;
          }

          .MuiButton-containedPrimary.MuiButton-containedPrimary {
            background-color: var(--purple-primary);
            color: #FFFFFF;
            box-shadow: var(--shadow-sm);

            &:hover {
              background-color: var(--purple-dark);
              box-shadow: var(--shadow-md);
              transform: translateY(-1px);
            }
          }

          .MuiButton-outlined.MuiButton-outlined {
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 9px 19px;

            &:hover {
              background-color: var(--interactive-hover);
              border-color: var(--divider-color);
              transform: translateY(-1px);
            }
          }

          .MuiButton-sizeSmall.MuiButton-sizeSmall {
            padding: 8px 16px;
            min-height: 36px;
            font-size: 13px;
          }

          /* Override MUI TextField with modern spacing */
          .MuiTextField-root {
            margin-bottom: 12px;
          }

          .MuiTextField-root .MuiOutlinedInput-root.MuiOutlinedInput-root {
            background-color: var(--input-bg, var(--bg-primary));
            color: var(--text-primary);
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 14px;

            fieldset {
              border-width: 1px;
              border-color: var(--input-border, var(--border-color));
            }

            &:hover fieldset {
              border-color: var(--divider-color);
            }

            &.Mui-focused.Mui-focused fieldset {
              border-color: var(--purple-primary);
              border-width: 1px;
              box-shadow: 0 0 0 3px var(--focus-ring);
            }
          }

          .MuiInputLabel-root.MuiInputLabel-root {
            color: var(--text-secondary);

            &.Mui-focused.Mui-focused {
              color: var(--purple-primary);
            }
          }

          /* Override MUI Chip */
          .MuiChip-root.MuiChip-root {
            border-radius: 6px;
          }

          .MuiChip-colorSuccess.MuiChip-colorSuccess {
            background-color: var(--status-success);
            color: #FFFFFF;
          }

          .MuiChip-colorError.MuiChip-colorError {
            background-color: var(--status-error);
            color: #FFFFFF;
          }

          .MuiChip-colorWarning.MuiChip-colorWarning {
            background-color: var(--status-warning);
            color: #FFFFFF;
          }

          /* Override MUI Alert */
          .MuiAlert-root.MuiAlert-root {
            border-radius: 6px;
          }

          .MuiAlert-standardSuccess.MuiAlert-standardSuccess {
            background-color: rgba(16, 185, 129, 0.1);
            color: var(--status-success);
          }

          .MuiAlert-standardError.MuiAlert-standardError {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--status-error);
          }

          .MuiAlert-standardWarning.MuiAlert-standardWarning {
            background-color: rgba(245, 158, 11, 0.1);
            color: var(--status-warning);
          }

          .MuiAlert-standardInfo.MuiAlert-standardInfo {
            background-color: rgba(59, 130, 246, 0.1);
            color: var(--status-info);
          }

          /* Override MUI Tabs */
          .MuiTabs-root.MuiTabs-root {
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 12px;
          }

          .MuiTab-root.MuiTab-root {
            color: var(--text-secondary);
            text-transform: none;

            &.Mui-selected.Mui-selected {
              color: var(--purple-primary);
            }
          }

          .MuiTabs-indicator.MuiTabs-indicator {
            background-color: var(--purple-primary);
          }

          /* Override Mui Card with modern spacing */
          .MuiCard-root.MuiCard-root {
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: var(--shadow-sm);
            margin-bottom: 12px;
            transition: all 0.2s ease;

            &:hover {
              box-shadow: var(--shadow-md);
              border-color: var(--divider-color);
            }
          }

          .MuiCardContent-root.MuiCardContent-root {
            padding: 16px;
          }

          /* Override MUI IconButton */
          .MuiIconButton-root.MuiIconButton-root {
            color: var(--text-primary);

            &:hover {
              background-color: var(--interactive-hover);
            }
          }

          /* Override MUI List */
          .MuiList-root.MuiList-root {
            background-color: var(--bg-secondary);
            border-radius: 8px;
          }

          .MuiListItem-root.MuiListItem-root {
            color: var(--text-primary);

            &:hover {
              background-color: var(--interactive-hover);
            }
          }

          /* Override MUI Table */
          .MuiTable-root.MuiTable-root {
            background-color: var(--bg-secondary);
          }

          .MuiTableHead-root.MuiTableHead-root {
            background-color: var(--bg-tertiary);
          }

          .MuiTableCell-root.MuiTableCell-root {
            color: var(--text-primary);
            border-color: var(--border-color);
          }

          .MuiTableCell-head.MuiTableCell-head {
            color: var(--text-secondary);
            font-weight: 600;
          }

          /* Override MUI Container with modern spacing */
          .MuiContainer-root.MuiContainer-root {
            background-color: transparent;
            padding-left: 0;
            padding-right: 0;
            padding-top: 0;
            padding-bottom: 0;
          }

          /* Override MUI Grid with modern spacing */
          .MuiGrid-container.MuiGrid-container {
            margin: -6px;
          }

          .MuiGrid-item.MuiGrid-item {
            padding: 6px;
          }

          /* Override MUI Stack spacing */
          .MuiStack-root.MuiStack-root {
            gap: 12px;
          }

          .MuiStack-spacing-2 > :not(style) ~ :not(style) {
            margin-top: 8px;
            margin-left: 0;
          }

          .MuiStack-spacing-3 > :not(style) ~ :not(style) {
            margin-top: 12px;
            margin-left: 0;
          }

          /* Override MUI Box spacing */
          .MuiBox-root.MuiBox-root {
            margin-bottom: 12px;
          }

          /* Override MUI Dialog */
          .MuiDialog-paper.MuiDialog-paper {
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: var(--shadow-xl);
            max-width: 600px;
          }

          .MuiDialogTitle-root.MuiDialogTitle-root {
            background-color: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 12px 16px;
            font-size: 16px;
            font-weight: 600;

            .MuiTypography-root {
              color: var(--text-primary);
              font-weight: 600;
            }
          }

          .MuiDialogContent-root.MuiDialogContent-root {
            background-color: var(--bg-primary);
            color: var(--text-primary);
            padding: 16px;
            overflow-y: auto;
          }

          .MuiDialogContent-dividers.MuiDialogContent-dividers {
            border-top: 1px solid var(--border-color);
            border-bottom: 1px solid var(--border-color);
          }

          .MuiDialogActions-root.MuiDialogActions-root {
            background-color: var(--bg-secondary);
            border-top: 1px solid var(--border-color);
            padding: 12px 16px;
            gap: 8px;

            .MuiButton-root {
              margin: 0;
            }
          }

          .MuiBackdrop-root.MuiBackdrop-root {
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
          }

          /* Override MUI Drawer */
          .MuiDrawer-paper.MuiDrawer-paper {
            background-color: var(--sidebar-bg);
            color: var(--sidebar-text);
          }

          /* Override MUI Tooltip */
          .MuiTooltip-tooltip.MuiTooltip-tooltip {
            background-color: rgba(0, 0, 0, 0.9);
            color: #FFFFFF;
            font-size: 12px;
            padding: 6px 10px;
            border-radius: 6px;
          }
        }
      `}</style>
      {children}
    </motion.div>
  );
}
