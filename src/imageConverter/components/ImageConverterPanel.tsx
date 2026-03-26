/**
 * Image Converter Panel — Main Layout Component
 * Thin wrapper using useImageConverterLogic hook.
 * Pattern: mirrors HtmlConverterPanel from htmlConverter.
 */

import { useImageConverterLogic } from "../hooks/useImageConverterLogic";
import FileUploadZone from "./FileUploadZone";
import SettingsSidebar from "./SettingsSidebar";
import BatchProcessor from "./BatchProcessor";

export default function ImageConverterPanel() {
  const { state, actions, settings } = useImageConverterLogic();

  return (
    <div className='w-full min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-3 md:p-5 lg:p-6 text-foreground font-sans transition-colors duration-500'>
      <div className='max-w-[1600px] mx-auto flex flex-col gap-4'>
        {/* HEADER — Floating Glassmorphism */}
        <header className='sticky top-3 z-[50] flex items-center justify-between w-full h-14 px-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none transition-all duration-300'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary'>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>
            <div>
              <h1 className='text-sm font-black text-foreground tracking-tight leading-tight'>FlexiBuilder Pro</h1>
              <p className='text-[10px] font-medium text-muted-foreground/70'>Image Studio</p>
            </div>
          </div>

          {/* QUICK STATS / BATCH ACTIONS IN HEADER (if desktop) */}
          <div className='hidden md:block'>
            <BatchProcessor
              files={state.files}
              settings={settings.settings}
              convertAll={actions.convertAll}
              downloadAll={actions.downloadAll}
              clearFiles={actions.clearFiles}
              variant="compact"
            />
          </div>
        </header>

        {/* MOBILE BATCH PROCESSOR (Shown only when files exist) */}
        <div className='md:hidden'>
          <BatchProcessor
            files={state.files}
            settings={settings.settings}
            convertAll={actions.convertAll}
            downloadAll={actions.downloadAll}
            clearFiles={actions.clearFiles}
            variant="default"
          />
        </div>

        {/* MAIN GRID */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'>
          {/* LEFT COLUMN — File Upload & Grid (8 cols) */}
          <div className='col-span-1 lg:col-span-8 flex flex-col gap-4'>
            <FileUploadZone
              files={state.files}
              addFiles={actions.addFiles}
              removeFile={actions.removeFile}
              downloadFile={actions.downloadFile}
              reorderFiles={actions.reorderFiles}
              toggleSelection={actions.toggleSelection}
              selectAll={actions.selectAll}
              deselectAll={actions.deselectAll}
              removeSelected={actions.removeSelected}
              downloadSelected={actions.downloadSelected}
              convertSelected={actions.convertSelected}
              selectedCount={state.selectedCount}
            />
          </div>

          {/* RIGHT COLUMN — Settings (4 cols) — Sticky */}
          <div className='col-span-1 lg:col-span-4 sticky top-20'>
            <SettingsSidebar
              files={state.files}
              settings={settings.settings}
              updateSettings={settings.updateSettings}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

