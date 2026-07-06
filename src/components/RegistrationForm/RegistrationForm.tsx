import { CheckCircle2, Eye, EyeOff, KeyRound, Mail, Save, ShieldCheck, SquareArrowOutUpRight } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";

import Modal from "../../templateLibrary/components/Modal";
import { triggerRegistrationStatusUpdate } from "../../hooks/useRegistrationStatus";
import { cn } from "../../lib/utils";
import { logger } from "../../utils/logger";

interface RegistrationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editMode?: boolean;
  initialData?: {
    userEmail?: string;
    senderEmail?: string;
    appPassword?: string;
  };
}

interface FormData {
  userEmail: string;
  senderEmail: string;
  appPassword: string;
}

const steps = [
  {
    label: "Email Setup",
    description: "Enter your Gmail credentials for sending emails",
  },
  {
    label: "App Password",
    description: "Generate and enter your Google App Password",
  },
  {
    label: "Save & Complete",
    description: "Review and save your configuration",
  },
];

const fieldClass =
  "w-full h-11 rounded-xl border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 focus:ring-primary/20";

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ open, onClose, onSuccess, editMode = false, initialData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    userEmail: initialData?.userEmail || "",
    senderEmail: initialData?.senderEmail || "",
    appPassword: initialData?.appPassword || "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.userEmail || !validateEmail(formData.userEmail)) {
      newErrors.userEmail = "Please enter a valid email address";
    }

    if (!formData.senderEmail || !validateEmail(formData.senderEmail)) {
      newErrors.senderEmail = "Please enter a valid Gmail address";
    }

    if (!formData.appPassword || formData.appPassword.length < 16) {
      newErrors.appPassword = "App password must be at least 16 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      const emailErrors: Partial<FormData> = {};
      if (!formData.userEmail || !validateEmail(formData.userEmail)) {
        emailErrors.userEmail = "Please enter a valid email address";
      }
      if (!formData.senderEmail || !validateEmail(formData.senderEmail)) {
        emailErrors.senderEmail = "Please enter a valid Gmail address";
      }

      if (Object.keys(emailErrors).length > 0) {
        setErrors(emailErrors);
        return;
      }
    }

    if (activeStep === 1) {
      if (!formData.appPassword || formData.appPassword.length < 16) {
        setErrors({ appPassword: "App password must be at least 16 characters" });
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const resetForm = () => {
    setFormData({ userEmail: "", senderEmail: "", appPassword: "" });
    setActiveStep(0);
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const registrationData = {
        userEmail: formData.userEmail,
        senderEmail: formData.senderEmail,
        appPassword: formData.appPassword,
        registeredAt: new Date().toISOString(),
        useStorageToggle: "localStorage" as const,
      };

      localStorage.setItem("emailSenderCredentials", JSON.stringify(registrationData));
      localStorage.setItem("emailSenderUseStorageToggle", "localStorage");

      toast.success(editMode ? "Credentials updated successfully!" : "Registration completed! Your credentials are saved securely.");

      triggerRegistrationStatusUpdate();
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      logger.error("RegistrationForm", "Registration error", error);
      toast.error("Failed to save registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidthClass='max-w-2xl'
      title={
        <div>
          <div className='flex items-center gap-2'>
            <ShieldCheck className='w-5 h-5 text-primary' />
            <span>{editMode ? "Edit Email Credentials" : "Email Registration"}</span>
          </div>
          <p className='mt-1 text-xs font-normal text-muted-foreground'>
            {editMode ? "Update your Gmail credentials for email sending" : "Set up your Gmail credentials for sending emails directly from the builder"}
          </p>
        </div>
      }
      actionsRow={
        <button type='button' onClick={handleClose} disabled={loading} className='px-4 py-2 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50'>
          Cancel
        </button>
      }>
      <div className='flex flex-col gap-6'>
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isPast = activeStep > index;
          if (!isActive && !isPast) return null;

          return (
            <div key={step.label} className='flex gap-4'>
              <div className='flex flex-col items-center'>
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0",
                    isActive ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
                  )}>
                  {isPast ? <CheckCircle2 className='w-4 h-4' /> : index + 1}
                </div>
                {index < steps.length - 1 && <div className='w-px flex-1 my-1 bg-border' />}
              </div>

              <div className='flex-1 min-w-0 pb-2'>
                <h3 className='text-sm font-bold text-foreground'>{step.label}</h3>

                {isActive && (
                  <>
                    <p className='mt-1 text-sm text-muted-foreground'>{step.description}</p>

                    {index === 0 && (
                      <div className='flex flex-col gap-4 mt-4'>
                        <div>
                          <div className='relative'>
                            <Mail className='absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                            <input
                              type='email'
                              placeholder='Your Email Address'
                              value={formData.userEmail}
                              onChange={(e) => handleInputChange("userEmail", e.target.value)}
                              className={cn(fieldClass, errors.userEmail ? "border-destructive focus:ring-destructive/20" : "border-border")}
                            />
                          </div>
                          <p className={cn("mt-1 text-xs", errors.userEmail ? "text-destructive" : "text-muted-foreground")}>
                            {errors.userEmail || "Email address that will receive the emails"}
                          </p>
                        </div>

                        <div>
                          <div className='relative'>
                            <Mail className='absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                            <input
                              type='email'
                              placeholder='Gmail Sender Address'
                              value={formData.senderEmail}
                              onChange={(e) => handleInputChange("senderEmail", e.target.value)}
                              className={cn(fieldClass, errors.senderEmail ? "border-destructive focus:ring-destructive/20" : "border-border")}
                            />
                          </div>
                          <p className={cn("mt-1 text-xs", errors.senderEmail ? "text-destructive" : "text-muted-foreground")}>
                            {errors.senderEmail || "Gmail address that will send the emails (must be @gmail.com)"}
                          </p>
                        </div>

                        <div>
                          <button
                            type='button'
                            onClick={handleNext}
                            disabled={!formData.userEmail || !formData.senderEmail}
                            className='px-4 py-2 text-sm font-semibold text-primary-foreground rounded-xl bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none'>
                            Continue to App Password
                          </button>
                        </div>
                      </div>
                    )}

                    {index === 1 && (
                      <div className='flex flex-col gap-4 mt-4'>
                        <div className='flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs leading-relaxed text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-200'>
                          <div className='min-w-0'>
                            You need to generate an App Password from your Google Account settings.{" "}
                            <a href='https://myaccount.google.com/apppasswords' target='_blank' rel='noopener noreferrer' className='inline-flex items-center gap-1 font-semibold underline'>
                              Generate App Password
                              <SquareArrowOutUpRight className='w-3 h-3' />
                            </a>
                          </div>
                        </div>

                        <div className='rounded-2xl border border-border/50 bg-card p-4'>
                          <p className='text-sm font-semibold text-foreground'>📋 How to get App Password:</p>
                          <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                            1. Visit Google Account settings
                            <br />
                            2. Go to Security → 2-Step Verification
                            <br />
                            3. Scroll to App passwords
                            <br />
                            4. Select &quot;Mail&quot; and generate password
                            <br />
                            5. Copy the 16-character password
                          </p>
                        </div>

                        <div>
                          <div className='relative'>
                            <KeyRound className='absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder='Google App Password'
                              value={formData.appPassword}
                              onChange={(e) => handleInputChange("appPassword", e.target.value)}
                              className={cn(fieldClass, "pr-10", errors.appPassword ? "border-destructive focus:ring-destructive/20" : "border-border")}
                            />
                            <button
                              type='button'
                              onClick={() => setShowPassword(!showPassword)}
                              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'>
                              {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                            </button>
                          </div>
                          <p className={cn("mt-1 text-xs", errors.appPassword ? "text-destructive" : "text-muted-foreground")}>
                            {errors.appPassword || "16-character app password from Google"}
                          </p>
                        </div>

                        <div className='flex gap-2'>
                          <button type='button' onClick={handleBack} className='px-4 py-2 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted transition-colors'>
                            Back
                          </button>
                          <button
                            type='button'
                            onClick={handleNext}
                            disabled={!formData.appPassword || formData.appPassword.length < 16}
                            className='px-4 py-2 text-sm font-semibold text-primary-foreground rounded-xl bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none'>
                            Review & Save
                          </button>
                        </div>
                      </div>
                    )}

                    {index === 2 && (
                      <div className='flex flex-col gap-4 mt-4'>
                        <div className='rounded-2xl border border-border/50 bg-card p-4'>
                          <div className='flex items-center gap-2 text-primary'>
                            <CheckCircle2 className='w-5 h-5' />
                            <span className='text-sm font-bold'>Configuration Summary</span>
                          </div>
                          <div className='my-3 border-t border-border/50' />
                          <div className='flex flex-col gap-3'>
                            <div>
                              <p className='text-xs font-semibold text-muted-foreground'>Recipient Email:</p>
                              <p className='text-sm text-foreground'>{formData.userEmail}</p>
                            </div>
                            <div>
                              <p className='text-xs font-semibold text-muted-foreground'>Sender Gmail:</p>
                              <p className='text-sm text-foreground'>{formData.senderEmail}</p>
                            </div>
                            <div>
                              <p className='text-xs font-semibold text-muted-foreground'>App Password:</p>
                              <p className='text-sm text-foreground'>{"•".repeat(formData.appPassword.length)}</p>
                            </div>
                          </div>
                        </div>

                        <div className='flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200'>
                          <Save className='w-4 h-4 shrink-0 mt-0.5' />
                          <div className='min-w-0'>Your credentials will be securely saved in browser localStorage</div>
                        </div>

                        <div className='flex gap-2'>
                          <button type='button' onClick={handleBack} className='px-4 py-2 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted transition-colors'>
                            Back
                          </button>
                          <button
                            type='button'
                            onClick={handleSave}
                            disabled={loading}
                            className='min-w-[120px] px-4 py-2 text-sm font-semibold text-primary-foreground rounded-xl bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none'>
                            {loading ? "Saving..." : editMode ? "Update Credentials" : "Complete Registration"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default RegistrationForm;
