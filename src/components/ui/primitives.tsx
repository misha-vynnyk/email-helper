/**
 * Shared Tailwind primitives for the Email Sender tab.
 * Mirrors the design language of imageConverter/htmlConverter panels.
 */

import { CircleCheck, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import React from "react";

import { cn } from "../../lib/utils";

export type NoteTone = "info" | "warning" | "success" | "error";

const NOTE_TONES: Record<NoteTone, { box: string; Icon: typeof Info }> = {
  info: {
    box: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-200",
    Icon: Info,
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200",
    Icon: TriangleAlert,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200",
    Icon: CircleCheck,
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-200",
    Icon: OctagonAlert,
  },
};

export function Note({
  tone = "info",
  children,
  className,
}: {
  tone?: NoteTone;
  children: React.ReactNode;
  className?: string;
}) {
  const { box, Icon } = NOTE_TONES[tone];
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed", box, className)}>
      <Icon className='w-4 h-4 shrink-0 mt-0.5' />
      <div className='min-w-0'>{children}</div>
    </div>
  );
}

/** Card shell used by every section of the tab */
export const cardClass = "bg-card border border-border/50 rounded-2xl shadow-soft transition-all duration-300";

/** Text input base (leave room for a leading icon with pl-9) */
export const inputClass =
  "w-full h-11 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

/** Section header: icon in a tinted rounded square + title/subtitle */
export function SectionHeader({
  icon,
  title,
  subtitle,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className='flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary shrink-0'>{icon}</div>
      <div className='min-w-0'>
        <h3 className='text-sm font-bold text-foreground leading-tight'>{title}</h3>
        {subtitle && <p className='text-[10px] text-muted-foreground mt-0.5'>{subtitle}</p>}
      </div>
    </div>
  );
}
