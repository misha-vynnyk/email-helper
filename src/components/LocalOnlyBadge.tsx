import { isApiAvailable } from "@/config/api";

const TOOLTIP = "Працює лише локально (потрібен backend) — недоступно в цій онлайн-демці";

/**
 * Small pill marking a feature that needs the Express backend.
 * Renders nothing unless this is a backend-less web build (e.g. the GitHub
 * Pages demo) — dev, Electron, and any web build with VITE_API_URL configured
 * all have a backend, so the badge stays invisible there.
 */
export function LocalOnlyBadge({ className = "" }: { className?: string }) {
  if (isApiAvailable()) return null;
  return (
    <span
      title={TOOLTIP}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 whitespace-nowrap ${className}`}>
      лише локально
    </span>
  );
}

/** Small corner dot for icon-only UI (e.g. tab triggers) — pair with a `relative` parent. */
export function LocalOnlyDot({ className = "" }: { className?: string }) {
  if (isApiAvailable()) return null;
  return (
    <span
      title={TOOLTIP}
      className={`absolute -top-0.5 -right-0.5 block w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-background ${className}`}
    />
  );
}
