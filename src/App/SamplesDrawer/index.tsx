import { Mail, Settings } from "lucide-react";
import React from "react";

import { useSamplesDrawerOpen } from "../../contexts/AppState";
import { useRegistrationStatus } from "../../hooks/useRegistrationStatus";
import { cn } from "../../lib/utils";

export const SAMPLES_DRAWER_WIDTH = 200;

interface SamplesDrawerProps {
  onSettingsOpen?: () => void;
  onRegistrationOpen?: () => void;
}

export default function SamplesDrawer({ onSettingsOpen, onRegistrationOpen }: SamplesDrawerProps = {}) {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const { isRegistered, hasValidCredentials } = useRegistrationStatus();
  const credentialsBroken = !hasValidCredentials && isRegistered;

  const handleFixedWheel = React.useCallback((event: React.WheelEvent) => {
    const scrollTarget = document.querySelector("[data-app-scroll='true']") as HTMLElement | null;
    if (!scrollTarget) {
      return;
    }
    scrollTarget.scrollBy({ top: event.deltaY });
  }, []);

  const handleEmailSettingsClick = () => {
    if (isRegistered) {
      onSettingsOpen?.();
    } else {
      onRegistrationOpen?.();
    }
  };

  return (
    <aside
      style={{ width: SAMPLES_DRAWER_WIDTH }}
      className={cn(
        "fixed inset-y-0 left-0 z-30 pt-2.5 border-r border-border bg-card/90 backdrop-blur-md shadow-soft transition-transform duration-300 ease-out",
        samplesDrawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className='relative z-10 flex flex-col justify-between h-full px-4 pb-4' onWheel={handleFixedWheel}>
        {/* Logo Section */}
        <div className='flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-background/50 shadow-soft transition-all duration-300 hover:shadow-soft-lg'>
          {/* Logo Icon */}
          <div className='flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md shrink-0 transition-transform duration-300 hover:scale-105 hover:rotate-2'>
            <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
              <rect x='2' y='4' width='20' height='16' rx='2' />
              <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
            </svg>
          </div>

          {/* Logo Text */}
          <div className='flex-1 min-w-0'>
            <div className='text-base font-bold leading-tight tracking-tight bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent'>
              FlexiBuilder
            </div>
            <div className='mt-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground'>Email Tools</div>
          </div>
        </div>

        {/* Bottom Section - Settings */}
        <div className='flex flex-col gap-3'>
          <div className='my-2 border-t border-border/50' />
          <button
            type='button'
            onClick={handleEmailSettingsClick}
            title={isRegistered ? "Email Settings" : "Setup Email"}
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-xl border border-border/50 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg",
              credentialsBroken
                ? "text-destructive bg-destructive/10 hover:bg-destructive/15"
                : "text-primary bg-primary/10 hover:bg-primary/15"
            )}>
            {isRegistered ? <Settings className='w-4 h-4' /> : <Mail className='w-4 h-4' />}
          </button>
        </div>
      </div>
    </aside>
  );
}
