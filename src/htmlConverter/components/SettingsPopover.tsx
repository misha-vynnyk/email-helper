import React, { Dispatch, SetStateAction } from "react";
import type { ImageAnalysisSettings } from "../types";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import { UiSettingsTab } from "./UiSettingsTab";
import { ImageSettingsTab } from "./ImageSettingsTab";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";

type SettingsPopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerElement: React.ReactNode;
  settingsTab: "ui" | "image";
  setSettingsTab: Dispatch<SetStateAction<"ui" | "image">>;
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
  imageAnalysis: ImageAnalysisSettings;
  setImageAnalysis: Dispatch<SetStateAction<ImageAnalysisSettings>>;
  autoProcess: boolean;
  setAutoProcess: Dispatch<SetStateAction<boolean>>;
  aiBackendStatus: "checking" | "online" | "offline";
};

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({ open, onOpenChange, triggerElement, settingsTab, setSettingsTab, ui, setUi, imageAnalysis, setImageAnalysis, autoProcess, setAutoProcess, aiBackendStatus }) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{triggerElement}</PopoverTrigger>
      <PopoverContent className='w-[420px] sm:w-[520px] p-0 rounded-2xl border-border shadow-soft-lg overflow-hidden bg-card/95 backdrop-blur-md' align='end' sideOffset={8}>
        <div className='flex items-center justify-between p-4 pb-2'>
          <div>
            <h4 className='text-sm font-bold'>Налаштування</h4>
            <p className='text-xs text-muted-foreground'>HTML Converter</p>
          </div>
          <button onClick={() => onOpenChange(false)} className='p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground'>
            <X className='w-4 h-4' />
          </button>
        </div>

        <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as "ui" | "image")} className='w-full'>
          <div className='px-3 pb-2'>
            <TabsList className='w-full h-9 grid grid-cols-2 rounded-lg bg-muted/50 p-1'>
              <TabsTrigger value='ui' className='text-xs rounded-md'>
                Інтерфейс
              </TabsTrigger>
              <TabsTrigger value='image' className='text-xs rounded-md'>
                Зображення
              </TabsTrigger>
            </TabsList>
          </div>

          <div className='h-px bg-border' />

          <div className='p-4 max-h-[60vh] overflow-y-auto'>
            <TabsContent value='ui' className='m-0 border-none p-0 outline-none'>
              <UiSettingsTab ui={ui} setUi={setUi} />
            </TabsContent>
            <TabsContent value='image' className='m-0 border-none p-0 outline-none'>
              <ImageSettingsTab ui={ui} setUi={setUi} imageAnalysis={imageAnalysis} setImageAnalysis={setImageAnalysis} autoProcess={autoProcess} setAutoProcess={setAutoProcess} aiBackendStatus={aiBackendStatus} />
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
