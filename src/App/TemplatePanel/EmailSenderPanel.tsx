import { Loader2, Mail } from "lucide-react";
import React, { lazy, Suspense } from "react";

import { EmailSenderProvider, useEmailSender } from "../../emailSender/EmailSenderContext";

// Lazy load email components for better performance
const EmailCredentialsForm = lazy(() => import("../../emailSender/EmailCredentialsForm"));
const EmailHtmlEditor = lazy(() => import("../../emailSender/EmailHtmlEditor"));

const STATUS_CONFIG = {
  online: { label: "Server Online", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  offline: { label: "Server Offline", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  checking: { label: "Checking...", dot: "bg-amber-500 animate-pulse", text: "text-muted-foreground" },
} as const;

function ServerStatusPill() {
  const { serverStatus } = useEmailSender();
  const status = STATUS_CONFIG[serverStatus];
  return (
    <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/50 shadow-inner'>
      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
      <span className={`text-[10px] font-bold tracking-wider uppercase ${status.text}`}>{status.label}</span>
    </div>
  );
}

// Main content of the email sender panel
const EmailSenderPanelContent: React.FC = () => {
  return (
    <div className='w-full min-h-full bg-[#F8FAFC] dark:bg-[#020617] p-3 md:p-5 lg:p-6 text-foreground font-sans transition-colors duration-500'>
      <div className='max-w-[1600px] mx-auto flex flex-col gap-4'>
        {/* HEADER */}
        <header className='flex items-center justify-between w-full h-16 px-6 bg-card border border-border/50 rounded-full shadow-sm hover:shadow-md transition-all duration-300'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary'>
              <Mail className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-base font-bold text-foreground tracking-tight leading-none'>Email Sender</h1>
              <p className='text-xs text-muted-foreground mt-0.5'>SMTP Test Delivery</p>
            </div>
          </div>
          <ServerStatusPill />
        </header>

        <Suspense
          fallback={
            <div className='flex items-center justify-center gap-3 p-10 text-muted-foreground'>
              <Loader2 className='w-6 h-6 animate-spin' />
              <span className='text-sm font-medium'>Loading email components...</span>
            </div>
          }
        >
          {/* MAIN GRID — editor left, configuration sidebar right (as in other tabs) */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'>
            <div className='col-span-1 lg:col-span-8 flex flex-col gap-4'>
              <EmailHtmlEditor />
            </div>
            <div className='col-span-1 lg:col-span-4 lg:sticky lg:top-5 flex flex-col gap-4'>
              <EmailCredentialsForm />
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default function EmailSenderPanel() {
  return (
    <EmailSenderProvider>
      <EmailSenderPanelContent />
    </EmailSenderProvider>
  );
}
