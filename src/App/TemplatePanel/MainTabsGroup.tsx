import { FolderOpen, Image as ImageIcon, LayoutGrid, Mail, Table } from "lucide-react";
import React from "react";

import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { BLOCK_LIBRARY_ENABLED } from "../../config/featureFlags";
import { setSelectedMainTab, useSelectedMainTab } from "../../contexts/AppState";

const TAB_VALUES = ["email", "blocks", "templates", "images", "converter"] as const;
type TabValue = (typeof TAB_VALUES)[number];

export default function MainTabsGroup() {
  const selectedMainTab = useSelectedMainTab();

  const handleChange = (v: string) => {
    // Використовуємо startTransition для не блокуючої зміни табу
    React.startTransition(() => {
      setSelectedMainTab(TAB_VALUES.includes(v as TabValue) ? (v as TabValue) : "email");
    });
  };

  return (
    <Tabs value={selectedMainTab} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value='email' title='Send Email'>
          <Mail className='w-4 h-4' />
        </TabsTrigger>
        {BLOCK_LIBRARY_ENABLED && (
          <TabsTrigger value='blocks' title='Block Library'>
            <LayoutGrid className='w-4 h-4' />
          </TabsTrigger>
        )}
        <TabsTrigger value='templates' title='Template Library'>
          <FolderOpen className='w-4 h-4' />
        </TabsTrigger>
        <TabsTrigger value='images' title='Image Converter'>
          <ImageIcon className='w-4 h-4' />
        </TabsTrigger>
        <TabsTrigger value='converter' title='HTML to Table Converter'>
          <Table className='w-4 h-4' />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
