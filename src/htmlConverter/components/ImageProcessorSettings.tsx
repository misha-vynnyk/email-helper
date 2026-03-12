interface ImageProcessorSettingsProps {
  quality: number;
  setQuality: (val: number) => void;
  maxWidth: number;
  setMaxWidth: (val: number) => void;
}

export function ImageProcessorSettings({ quality, setQuality, maxWidth, setMaxWidth }: ImageProcessorSettingsProps) {
  return (
    <div className='flex flex-wrap gap-6 items-start'>
      <div className='flex-1 min-w-[150px]'>
        <div className='flex justify-between items-center mb-1.5'>
          <span className='text-xs text-muted-foreground'>Якість:</span>
          <span className='text-xs font-semibold text-primary'>{quality}%</span>
        </div>
        <input type='range' min='60' max='100' value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className='w-full accent-primary cursor-pointer' />
      </div>
      <div className='flex-1 min-w-[150px]'>
        <div className='flex justify-between items-center mb-1.5'>
          <span className='text-xs text-muted-foreground'>Макс. ширина:</span>
          <span className='text-xs font-semibold text-primary'>{maxWidth}px</span>
        </div>
        <input type='range' min='300' max='1200' step='100' value={maxWidth} onChange={(e) => setMaxWidth(parseInt(e.target.value))} className='w-full accent-primary cursor-pointer' />
      </div>
    </div>
  );
}
