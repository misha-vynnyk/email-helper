import React, { Dispatch, SetStateAction } from "react";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type UiSettingsTabProps = {
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
};

export const UiSettingsTab: React.FC<UiSettingsTabProps> = ({ ui, setUi }) => {
  return (
    <div className='flex flex-col gap-6'>
      <div className='space-y-4'>
        <h3 className='text-sm font-semibold tracking-tight'>Інтерфейс</h3>
        <div className='grid gap-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='showLogsPanel' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Показувати лог
            </Label>
            <Switch id='showLogsPanel' checked={ui.showLogsPanel} onCheckedChange={(checked) => setUi((prev) => ({ ...prev, showLogsPanel: checked }))} />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='showInputHtml' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Показувати вхідний HTML
            </Label>
            <Switch id='showInputHtml' checked={ui.showInputHtml} onCheckedChange={(checked) => setUi((prev) => ({ ...prev, showInputHtml: checked }))} />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='showUploadHistory' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Показувати історію завантажень
            </Label>
            <Switch id='showUploadHistory' checked={ui.showUploadHistory} onCheckedChange={(checked) => setUi((prev) => ({ ...prev, showUploadHistory: checked }))} />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='rememberUiLayout' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Запамʼятовувати вигляд (layout)
            </Label>
            <Switch id='rememberUiLayout' checked={ui.rememberUiLayout} onCheckedChange={(checked) => setUi((prev) => ({ ...prev, rememberUiLayout: checked }))} />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='compactMode' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Компактний режим
            </Label>
            <Switch id='compactMode' checked={ui.compactMode} onCheckedChange={(checked) => setUi((prev) => ({ ...prev, compactMode: checked }))} />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='stickyActions' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Закріпити кнопки зверху
            </Label>
            <Switch id='stickyActions' checked={ui.stickyActions} onCheckedChange={(checked) => setUi((prev) => ({ ...prev, stickyActions: checked }))} />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='showApproveNeeded' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Показувати "Approve Needed"
            </Label>
            <Switch id='showApproveNeeded' checked={ui.showApproveNeeded} onCheckedChange={(checked) => setUi((prev) => ({ ...prev, showApproveNeeded: checked }))} />
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='autoCloseUploadDialog' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Авто-закриття після завантаження
            </Label>
            <Switch id='autoCloseUploadDialog' checked={ui.autoCloseUploadDialog} onCheckedChange={(checked) => setUi((prev) => ({ ...prev, autoCloseUploadDialog: checked }))} />
          </div>
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <Label htmlFor='warningSize' className='min-w-[200px] text-sm font-medium leading-none'>
          Попередження про розмір файлу (KB):
        </Label>
        <Input
          id='warningSize'
          type='number'
          value={ui.warningFileSizeKB}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) setUi((prev) => ({ ...prev, warningFileSizeKB: val }));
          }}
          min={0}
          step={100}
          className='w-24'
        />
      </div>

      <p className='text-[13px] text-muted-foreground'>Якщо вимкнути «Запамʼятовувати вигляд» — ці налаштування не збережуться після перезавантаження.</p>
    </div>
  );
};
