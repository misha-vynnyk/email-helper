import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

interface BeforeAfterPreviewProps {
  beforeSrc: string;
  afterSrc: string;
}

export default function BeforeAfterPreview({ beforeSrc, afterSrc }: BeforeAfterPreviewProps) {
  return (
    <div className='rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'>
      <ReactCompareSlider itemOne={<ReactCompareSliderImage src={beforeSrc} alt='Before' />} itemTwo={<ReactCompareSliderImage src={afterSrc} alt='After' />} />
    </div>
  );
}
