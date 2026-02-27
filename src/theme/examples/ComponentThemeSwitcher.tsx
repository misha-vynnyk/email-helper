import { useState } from "react";
import { MOCK_CAMPAIGNS } from "./mockData";
import { ModernDashboardCampaigns } from "./ModernDashboardCampaigns";
import { ClassicListCampaigns } from "./ClassicListCampaigns";
import { LayoutGrid, List } from "lucide-react";

type ThemeType = "modern" | "classic";

export const ComponentThemeSwitcher = () => {
  const [activeTheme, setActiveTheme] = useState<ThemeType>("modern");

  return (
    <div className='p-8 min-h-screen bg-background flex flex-col gap-8'>
      {/* Theme Controls */}
      <div className='bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-card-foreground'>Campaigns Dashboard</h2>
          <p className='text-sm text-muted-foreground'>Showing Level-3 structural theming</p>
        </div>

        <div className='flex bg-muted p-1 rounded-lg'>
          <button onClick={() => setActiveTheme("modern")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTheme === "modern" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <LayoutGrid className='w-4 h-4' />
            Modern Grid
          </button>

          <button onClick={() => setActiveTheme("classic")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTheme === "classic" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <List className='w-4 h-4' />
            Classic List
          </button>
        </div>
      </div>

      {/*
        This is Level 3 Theming!
        Instead of using CSS to hide/show parts of a giant component,
        we completely swap out the React component tree based on the theme.
      */}
      <div className='transition-all duration-300'>{activeTheme === "modern" ? <ModernDashboardCampaigns campaigns={MOCK_CAMPAIGNS} /> : <ClassicListCampaigns campaigns={MOCK_CAMPAIGNS} />}</div>
    </div>
  );
};
