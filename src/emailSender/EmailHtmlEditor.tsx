import { html } from "@codemirror/lang-html";
import { useTheme } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { Eraser, FileCode2, Loader2, Send, Text, TriangleAlert } from "lucide-react";
import React from "react";

import { cardClass, inputClass, Note, SectionHeader } from "../components/ui/primitives";
import EmailValidationPanel from "../emailValidator/EmailValidationPanel";
import { cn } from "../lib/utils";
import { useThemeMode } from "../theme";
import { createCodeMirrorTheme } from "../utils/codemirrorTheme";
import { useEmailSender } from "./EmailSenderContext";

const EmailHtmlEditor: React.FC = () => {
  // MUI theme is kept only to build the shared CodeMirror theme (same as TemplateItem)
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const codeMirrorTheme = createCodeMirrorTheme(theme, mode, style);
  const {
    editorHtml,
    setEditorHtml,
    subject,
    setSubject,
    loading,
    sendEmail,
    isReadyToSend,
    areCredentialsValid,
    serverStatus,
  } = useEmailSender();

  const handleClearEditor = () => {
    setEditorHtml("");
    // Subject залишаємо без змін
  };

  const isDisabled = loading || !isReadyToSend || !areCredentialsValid || serverStatus === "offline";

  return (
    <div className='flex flex-col gap-4'>
      <div className={cn(cardClass, "p-4 md:p-5 flex flex-col gap-4")}>
        <SectionHeader
          icon={<FileCode2 size={16} />}
          title='Email Template Editor'
          subtitle='Compose & validate before sending'
        />

        {serverStatus === "offline" && (
          <Note tone='error'>Email server is offline. Please start the backend server.</Note>
        )}

        <label className='flex flex-col gap-1.5'>
          <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>Email Subject</span>
          <div className='relative'>
            <Text className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='Enter email subject...'
              className={cn(inputClass, "pl-9 pr-3")}
            />
          </div>
          <span className='text-[11px] text-muted-foreground'>A descriptive subject line for your email</span>
        </label>

        {/* Email Validation Panel */}
        <EmailValidationPanel
          html={editorHtml}
          onHtmlChange={setEditorHtml}
          showCompactView={false}
        />

        <div className='flex flex-col gap-1.5'>
          <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>HTML Content</span>
          <div className='rounded-xl border border-border overflow-hidden [&_.cm-editor]:!outline-none [&_.cm-selectionBackground]:!bg-primary/25 [&_.cm-content_::selection]:!bg-primary/25'>
            <CodeMirror
              value={editorHtml}
              onChange={(value) => setEditorHtml(value)}
              height='400px'
              extensions={[html(), ...codeMirrorTheme]}
              theme={undefined}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: true,
                searchKeymap: true,
              }}
            />
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className='sticky bottom-3 z-10 flex items-center justify-between gap-3 p-3 bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg'>
        <button
          type='button'
          onClick={handleClearEditor}
          className='flex items-center gap-2 px-4 py-2.5 rounded-full border border-amber-500/40 text-amber-600 dark:text-amber-400 text-sm font-bold hover:bg-amber-500/10 active:scale-95 transition-all'
        >
          <Eraser className='w-4 h-4' />
          Clear Editor
        </button>

        <div className='flex items-center gap-3 min-w-0'>
          {!areCredentialsValid && (
            <div className='hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs font-semibold'>
              <TriangleAlert className='w-3.5 h-3.5 shrink-0' />
              Configure credentials first
            </div>
          )}

          <button
            type='button'
            onClick={sendEmail}
            disabled={isDisabled}
            className='flex items-center justify-center gap-2 min-w-[160px] h-12 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none'
          >
            {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
            {loading ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
};

export { EmailHtmlEditor };
export default EmailHtmlEditor;
