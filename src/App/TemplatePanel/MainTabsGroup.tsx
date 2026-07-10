import { FolderOpen, Image as ImageIcon, LayoutGrid, Mail, Table } from "lucide-react";
import React from "react";

import { LocalOnlyDot } from "../../components/LocalOnlyBadge";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { isApiAvailable } from "../../config/api";
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
        <TabsTrigger value='email' title={isApiAvailable() ? "Send Email" : "Send Email (лише локально — потрібен backend)"} className='relative'>
          <Mail className='w-4 h-4' />
          <LocalOnlyDot />
        </TabsTrigger>
        {BLOCK_LIBRARY_ENABLED && (
          <TabsTrigger value='blocks' title='Block Library'>
            <LayoutGrid className='w-4 h-4' />
          </TabsTrigger>
        )}
        <TabsTrigger value='templates' title={isApiAvailable() ? "Template Library" : "Template Library (лише локально — потрібен backend)"} className='relative'>
          <FolderOpen className='w-4 h-4' />
          <LocalOnlyDot />
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
