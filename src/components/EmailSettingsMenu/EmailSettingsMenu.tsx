import { CheckCircle2, Info, KeyRound, Mail, Pencil, Settings, Shield, Trash2, TriangleAlert } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";

import { triggerRegistrationStatusUpdate, useRegistrationStatus } from "../../hooks/useRegistrationStatus";
import Modal from "../../templateLibrary/components/Modal";
import { logger } from "../../utils/logger";

interface EmailSettingsMenuProps {
  open: boolean;
  onClose: () => void;
  onEditCredentials?: () => void;
}

export const EmailSettingsMenu: React.FC<EmailSettingsMenuProps> = ({ open, onClose, onEditCredentials }) => {
  const { isRegistered, registrationData, hasValidCredentials, registeredAt } = useRegistrationStatus();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDeleteCredentials = () => {
    try {
      localStorage.removeItem("emailSenderCredentials");
      localStorage.removeItem("emailSenderUseStorageToggle");

      toast.success("Email credentials deleted successfully");
      triggerRegistrationStatusUpdate();
      setDeleteConfirmOpen(false);
      onClose();
    } catch (error) {
      logger.error("EmailSettingsMenu", "Error deleting credentials", error);
      toast.error("Failed to delete credentials");
    }
  };

  const handleEditCredentials = () => {
    onEditCredentials?.();
    onClose();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const maskEmail = (email: string) => {
    if (!email || !email.includes("@")) return email;
    const [local, domain] = email.split("@");
    const maskedLocal = local.length > 2 ? local.substring(0, 2) + "*".repeat(Math.max(0, local.length - 4)) + local.slice(-2) : local;
    return `${maskedLocal}@${domain}`;
  };

  const maskPassword = (password: string) => {
    return "•".repeat(Math.min(password.length, 16));
  };

  if (!open) return null;

  if (!isRegistered || !registrationData) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        maxWidthClass='max-w-md'
        title={
          <div className='flex items-center gap-2'>
            <Settings className='w-5 h-5 text-primary' />
            <span>Email Settings</span>
          </div>
        }
        actionsRow={
          <>
            <button type='button' onClick={onClose} className='px-4 py-2 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted transition-colors'>
              Close
            </button>
            <button type='button' onClick={handleEditCredentials} className='px-4 py-2 text-sm font-semibold text-primary-foreground rounded-xl bg-primary hover:bg-primary/90 transition-colors'>
              Setup Email
            </button>
          </>
        }>
        <div className='flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs leading-relaxed text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-200'>
          <Info className='w-4 h-4 shrink-0 mt-0.5' />
          <div className='min-w-0'>No email credentials found. Set up your email configuration to start sending emails.</div>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        maxWidthClass='max-w-2xl'
        title={
          <div className='flex items-center gap-2'>
            <Settings className='w-5 h-5 text-primary' />
            <span>Email Settings</span>
          </div>
        }
        actionsRow={
          <button type='button' onClick={onClose} className='px-4 py-2 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted transition-colors'>
            Close
          </button>
        }>
        <div className='flex flex-col gap-4'>
          {/* Status Alert */}
          <div
            className={
              hasValidCredentials
                ? "flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200"
            }>
            {hasValidCredentials ? <CheckCircle2 className='w-4 h-4 shrink-0 mt-0.5' /> : <TriangleAlert className='w-4 h-4 shrink-0 mt-0.5' />}
            <div className='min-w-0'>{hasValidCredentials ? "Your email credentials are valid and ready to use" : "Your email credentials need attention - some fields may be invalid"}</div>
          </div>

          {/* Credentials Summary Card */}
          <div className='rounded-2xl border border-border/50 bg-card p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <Shield className='w-4 h-4 text-primary' />
              <span className='text-sm font-bold text-foreground'>Saved Credentials</span>
              <span
                className={
                  hasValidCredentials
                    ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                }>
                {hasValidCredentials ? "Valid" : "Needs Review"}
              </span>
            </div>

            <ul className='flex flex-col gap-3'>
              <li className='flex items-center gap-3'>
                <Mail className='w-4 h-4 shrink-0 text-muted-foreground' />
                <div className='min-w-0'>
                  <p className='text-xs font-semibold text-foreground'>Recipient Email</p>
                  <p className='text-xs text-muted-foreground'>{registrationData.userEmail || "Not set"}</p>
                </div>
              </li>
              <li className='flex items-center gap-3'>
                <Mail className='w-4 h-4 shrink-0 text-muted-foreground' />
                <div className='min-w-0'>
                  <p className='text-xs font-semibold text-foreground'>Gmail Sender</p>
                  <p className='text-xs text-muted-foreground'>{maskEmail(registrationData.senderEmail || "")}</p>
                </div>
              </li>
              <li className='flex items-center gap-3'>
                <KeyRound className='w-4 h-4 shrink-0 text-muted-foreground' />
                <div className='min-w-0'>
                  <p className='text-xs font-semibold text-foreground'>App Password</p>
                  <p className='text-xs text-muted-foreground'>{registrationData.appPassword ? maskPassword(registrationData.appPassword) : "Not set"}</p>
                </div>
              </li>
              <li className='flex items-center gap-3'>
                <Shield className='w-4 h-4 shrink-0 text-muted-foreground' />
                <div className='min-w-0'>
                  <p className='text-xs font-semibold text-foreground'>Storage Method</p>
                  <p className='text-xs text-muted-foreground'>Browser localStorage</p>
                </div>
              </li>
              {registeredAt && (
                <li className='flex items-center gap-3'>
                  <Info className='w-4 h-4 shrink-0 text-muted-foreground' />
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold text-foreground'>Registered</p>
                    <p className='text-xs text-muted-foreground'>{formatDate(registeredAt)}</p>
                  </div>
                </li>
              )}
            </ul>

            <div className='flex gap-2 mt-4'>
              <button
                type='button'
                onClick={handleEditCredentials}
                className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition-colors'>
                <Pencil className='w-3.5 h-3.5' />
                Edit Credentials
              </button>
              <button
                type='button'
                onClick={() => setDeleteConfirmOpen(true)}
                className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors'>
                <Trash2 className='w-3.5 h-3.5' />
                Delete All
              </button>
            </div>
          </div>

          {/* Help Information */}
          <div className='rounded-2xl border border-border/50 bg-card p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Info className='w-4 h-4 text-primary' />
              <span className='text-sm font-bold text-foreground'>Important Information</span>
            </div>
            <div className='flex flex-col gap-1.5 text-xs text-muted-foreground'>
              <p>• Your credentials are stored locally in your browser only</p>
              <p>• Use Google App Passwords, not your regular Gmail password</p>
              <p>• Deleting credentials will require re-registration to send emails</p>
              <p>• Credentials are not synced across devices or browsers</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidthClass='max-w-md'
        title={
          <div className='flex items-center gap-2'>
            <TriangleAlert className='w-5 h-5 text-destructive' />
            <span>Delete Email Credentials?</span>
          </div>
        }
        actionsRow={
          <>
            <button type='button' onClick={() => setDeleteConfirmOpen(false)} className='px-4 py-2 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted transition-colors'>
              Cancel
            </button>
            <button
              type='button'
              onClick={handleDeleteCredentials}
              className='flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-destructive hover:bg-destructive/90 transition-colors'>
              <Trash2 className='w-4 h-4' />
              Delete Credentials
            </button>
          </>
        }>
        <p className='text-sm text-foreground'>Are you sure you want to delete your saved email credentials?</p>
        <p className='mt-2 text-xs text-muted-foreground'>This action cannot be undone. You will need to re-register your email settings to send emails from the builder.</p>
      </Modal>
    </>
  );
};

export default EmailSettingsMenu;
