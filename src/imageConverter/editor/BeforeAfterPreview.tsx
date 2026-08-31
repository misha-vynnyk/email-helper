import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

import { CHECKERBOARD_STYLE } from "./checkerboardStyle";

interface BeforeAfterPreviewProps {
  beforeSrc: string;
  afterSrc: string;
  /** True when `afterSrc` has real alpha=0 pixels (background removed to
   * "transparent" mode). ReactCompareSlider stacks itemTwo directly on top of
   * itemOne, so any transparent pixel in the "after" image shows the still-fully-
   * opaque "before" image behind it instead of the removed background — the wipe
   * comparison silently hides the one thing it's meant to show. Side-by-side against
   * a checkerboard is the only layout where the removed background is actually
   * visible. */
  afterHasTransparency?: boolean;
}

export default function BeforeAfterPreview({ beforeSrc, afterSrc, afterHasTransparency }: BeforeAfterPreviewProps) {
  if (afterHasTransparency) {
    return (
      <div className='w-full grid grid-cols-2 gap-3'>
        <div className='flex flex-col gap-1.5'>
          <p className='text-[11px] font-medium text-muted-foreground text-center'>Before</p>
          <div className='rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'>
            <img src={beforeSrc} alt='Before' className='w-full h-full object-contain' />
          </div>
        </div>
        <div className='flex flex-col gap-1.5'>
          <p className='text-[11px] font-medium text-muted-foreground text-center'>After</p>
          <div className='rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700' style={CHECKERBOARD_STYLE}>
            <img src={afterSrc} alt='After' className='w-full h-full object-contain' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'>
      <ReactCompareSlider itemOne={<ReactCompareSliderImage src={beforeSrc} alt='Before' />} itemTwo={<ReactCompareSliderImage src={afterSrc} alt='After' />} />
    </div>
  );
}
