import { AtSign, ChevronDown, Eye, EyeOff, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import React from "react";

import { cn } from "../lib/utils";
import { useEmailSender } from "./EmailSenderContext";
import { StorageToggle } from "./StorageToggle";
import { cardClass, inputClass, Note, SectionHeader } from "./ui";

function Field({
  label,
  helper,
  icon,
  children,
}: {
  label: string;
  helper?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className='flex flex-col gap-1.5'>
      <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>{label}</span>
      <div className='relative'>
        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none'>{icon}</span>
        {children}
      </div>
      {helper && <span className='text-[11px] text-muted-foreground'>{helper}</span>}
    </label>
  );
}

const EmailCredentialsForm: React.FC = () => {
  const {
    userEmail,
    setUserEmail,
    senderEmail,
    setSenderEmail,
    appPassword,
    setAppPassword,
    areCredentialsValid,
    useStorageToggle,
  } = useEmailSender();

  const [showPassword, setShowPassword] = React.useState(false);

  // За замовчуванням відкрито для всіх режимів крім "state" (Manual Entry)
  const [isExpanded, setIsExpanded] = React.useState(() => {
    const saved = localStorage.getItem("emailCredentialsExpanded");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return useStorageToggle !== "state"; // Закрито тільки для Manual Entry
  });

  // Зберігаємо стан згортання
  React.useEffect(() => {
    localStorage.setItem("emailCredentialsExpanded", JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Автоматично відкриваємо при зміні режиму (крім Manual Entry)
  React.useEffect(() => {
    if (useStorageToggle === "state") {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [useStorageToggle]);

  return (
    <>
      <StorageToggle />

      <div className={cn(cardClass, "p-4")}>
        <button
          type='button'
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className='flex items-center justify-between w-full gap-3 rounded-xl -m-1 p-1 hover:bg-muted/50 transition-colors'
        >
          <SectionHeader
            icon={<KeyRound size={16} />}
            title='Email Configuration'
            subtitle='Gmail SMTP credentials'
          />
          <ChevronDown
            className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")}
          />
        </button>

        {isExpanded && (
          <div className='flex flex-col gap-4 mt-4 animate-in fade-in slide-in-from-top-1 duration-200'>
            {!areCredentialsValid && (
              <Note tone='info'>
                Please configure your email credentials to send emails. Use Gmail app passwords for authentication.
              </Note>
            )}

            <Field label='Gmail Sender' helper="The Gmail account you'll send emails from" icon={<UserRound className='w-4 h-4' />}>
              <input
                type='email'
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder='your-email@gmail.com'
                className={cn(inputClass, "pl-9 pr-3")}
              />
            </Field>

            <Field label='Recipient Email' helper='The email address that will receive the template' icon={<AtSign className='w-4 h-4' />}>
              <input
                type='email'
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder='recipient@example.com'
                className={cn(inputClass, "pl-9 pr-3")}
              />
            </Field>

            <Field label='Gmail App Password' icon={<ShieldCheck className='w-4 h-4' />}>
              <input
                id='app-password'
                type={showPassword ? "text" : "password"}
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder='16-character app password'
                className={cn(inputClass, "pl-9 pr-11")}
              />
              <button
                type='button'
                aria-label='toggle password visibility'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
              >
                {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
              </button>
            </Field>

            <Note tone='warning'>
              <strong>Important:</strong> Use Gmail App Passwords, not your regular password.
              <br />
              Generate one at: Google Account → Security → 2-Step Verification → App passwords
            </Note>
          </div>
        )}
      </div>
    </>
  );
};

export { EmailCredentialsForm };
export default EmailCredentialsForm;
