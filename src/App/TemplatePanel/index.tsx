import { Loader2 } from "lucide-react";
import React from "react";

import { BLOCK_LIBRARY_ENABLED } from "../../config/featureFlags";
import { useSelectedMainTab } from "../../contexts/AppState";
import { EmailSenderProvider } from "../../emailSender/EmailSenderContext";
import { cn } from "../../lib/utils";
import { ThemeToggle } from "../../theme/ThemeToggle";
import ToggleSamplesPanelButton from "../SamplesDrawer/ToggleSamplesPanelButton";
import MainTabsGroup from "./MainTabsGroup";
import TabPanel from "./TabPanel";

// Code-splitting: кожен таб — окремий чанк, завантажується при першому відкритті
const EmailSenderPanel = React.lazy(() => import("./EmailSenderPanel"));
const BlockLibrary = React.lazy(() => import("../../blockLibrary/BlockLibrary"));
const TemplateLibrary = React.lazy(() => import("../../templateLibrary/TemplateLibrary"));
const ImageConverterPanel = React.lazy(() => import("../../imageConverter/components/ImageConverterPanel"));
const HtmlConverterPanel = React.lazy(() => import("../../htmlConverter/HtmlConverterPanel"));

const tabLoadingFallback = (
  <div className='flex items-center justify-center h-full'>
    <Loader2 className='w-10 h-10 animate-spin text-primary' />
  </div>
);

export default function TemplatePanel() {
  const selectedMainTab = useSelectedMainTab();
  // useDeferredValue - рендер контенту відкладається, таб-індикатор оновлюється миттєво
  const deferredTab = React.useDeferredValue(selectedMainTab);

  // Індикатор переходу між табами
  const isTransitioning = selectedMainTab !== deferredTab;

  // Відстежуємо які таби вже були відкриті для lazy mounting
  const [mountedTabs, setMountedTabs] = React.useState<Set<string>>(new Set(["email"]));

  React.useEffect(() => {
    // Монтуємо таб при першому відкритті
    if (!mountedTabs.has(selectedMainTab)) {
      setMountedTabs((prev) => new Set([...prev, selectedMainTab]));
    }
  }, [selectedMainTab, mountedTabs]);

  const handleFixedWheel = React.useCallback((event: React.WheelEvent) => {
    const scrollTarget = document.querySelector("[data-app-scroll='true']") as HTMLElement | null;
    if (!scrollTarget) {
      return;
    }
    scrollTarget.scrollBy({ top: event.deltaY });
  }, []);

  return (
    <>
      <header
        className='sticky top-0 z-40 flex items-center justify-between h-12 px-2 border-b border-border bg-card/90 backdrop-blur-md'
        onWheel={handleFixedWheel}>
        <div className='relative z-10 min-w-10'>
          <ToggleSamplesPanelButton />
        </div>
        <div className='relative z-10 flex items-center justify-center flex-1 px-4'>
          <MainTabsGroup />
        </div>
        <div className='relative z-10 flex items-center justify-end gap-1 min-w-10'>
          <ThemeToggle />
        </div>
      </header>
      <div className='relative h-[calc(100vh-48px)] min-w-[370px] overflow-hidden'>
        {/* Loading overlay при переході між табами */}
        <div
          className={cn(
            "absolute inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm transition-opacity",
            isTransitioning ? "opacity-100 duration-100 pointer-events-auto" : "opacity-0 duration-200 pointer-events-none"
          )}>
          <Loader2 className='w-10 h-10 animate-spin text-primary' />
        </div>

        {/* Lazy mounting: рендеримо таб лише якщо він був відкритий хоча б раз */}
        <React.Suspense fallback={tabLoadingFallback}>
          <TabPanel value='email' selectedValue={deferredTab} mounted={mountedTabs.has("email")}>
            <EmailSenderPanel />
          </TabPanel>

          {BLOCK_LIBRARY_ENABLED && (
            <TabPanel value='blocks' selectedValue={deferredTab} mounted={mountedTabs.has("blocks")}>
              <BlockLibrary />
            </TabPanel>
          )}

          <TabPanel value='templates' selectedValue={deferredTab} mounted={mountedTabs.has("templates")}>
            <EmailSenderProvider>
              <TemplateLibrary />
            </EmailSenderProvider>
          </TabPanel>

          <TabPanel value='images' selectedValue={deferredTab} mounted={mountedTabs.has("images")}>
            <ImageConverterPanel />
          </TabPanel>

          <TabPanel value='converter' selectedValue={deferredTab} mounted={mountedTabs.has("converter")}>
            <HtmlConverterPanel />
          </TabPanel>
        </React.Suspense>
      </div>
    </>
  );
}
