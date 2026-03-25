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
    <div className='w-full min-h-screen bg-background p-4 md:p-8 text-foreground font-sans transition-colors duration-300'>
      <div className='max-w-[1600px] mx-auto flex flex-col gap-6'>
        {/* HEADER */}
        <header className='flex items-center justify-between w-full h-16 px-6 bg-card border border-border/50 rounded-full shadow-sm hover:shadow-md transition-all duration-300'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary'>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>
            <div>
              <h1 className='text-base font-bold text-foreground tracking-tight leading-none'>Image Converter</h1>
              <p className='text-xs text-muted-foreground mt-0.5'>Format, Quality & Resize</p>
            </div>
          </div>
        </header>

        {/* BATCH PROCESSOR BAR */}
        <BatchProcessor
          files={state.files}
          settings={settings.settings}
          convertAll={actions.convertAll}
          downloadAll={actions.downloadAll}
          clearFiles={actions.clearFiles}
        />

        {/* MAIN GRID */}
        <div className='grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'>
          {/* LEFT COLUMN — File Upload & Grid (7 cols) */}
          <div className='col-span-1 xl:col-span-7 flex flex-col gap-6'>
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

          {/* RIGHT COLUMN — Settings (5 cols) */}
          <div className='col-span-1 xl:col-span-5 flex flex-col gap-6'>
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
