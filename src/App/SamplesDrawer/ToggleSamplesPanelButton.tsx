import { Menu, PanelLeftClose } from "lucide-react";

import { toggleSamplesDrawerOpen, useSamplesDrawerOpen } from "../../contexts/AppState";

export default function ToggleSamplesPanelButton() {
  const samplesDrawerOpen = useSamplesDrawerOpen();

  return (
    <button
      type='button'
      onClick={toggleSamplesDrawerOpen}
      title={samplesDrawerOpen ? "Close menu" : "Open menu"}
      className='flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'>
      {samplesDrawerOpen ? <PanelLeftClose className='w-4 h-4' /> : <Menu className='w-4 h-4' />}
    </button>
  );
}

