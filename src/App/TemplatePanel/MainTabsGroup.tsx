import React, { useEffect } from "react";

import { EmailOutlined, FolderOpen, Image as ImageIcon, ViewModule } from "@mui/icons-material";
import { Tab, Tabs, Tooltip } from "@mui/material";

import { setSelectedMainTab, useSelectedMainTab } from "../../documents/editor/EditorContext";

const IS_PRODUCTION = import.meta.env.PROD;

export default function MainTabsGroup() {
  const selectedMainTab = useSelectedMainTab();
  
  // On production, if blocks/templates tab is selected, switch to email
  useEffect(() => {
    if (IS_PRODUCTION && (selectedMainTab === "blocks" || selectedMainTab === "templates")) {
      setSelectedMainTab("email");
    }
  }, [selectedMainTab]);

  const handleChange = (
    _: React.SyntheticEvent,
    v: "email" | "blocks" | "templates" | "images"
  ) => {
    if (v === "email" || v === "blocks" || v === "templates" || v === "images") {
      setSelectedMainTab(v);
    } else {
      setSelectedMainTab("email");
    }
  };

  return (
    <Tabs
      value={selectedMainTab}
      onChange={handleChange}
    >
      <Tab
        value='email'
        label={
          <Tooltip title='Send Email'>
            <EmailOutlined fontSize='small' />
          </Tooltip>
        }
      />
      {!IS_PRODUCTION && (
        <Tab
          value='blocks'
          label={
            <Tooltip title='Block Library (Local only)'>
              <ViewModule fontSize='small' />
            </Tooltip>
          }
        />
      )}
      {!IS_PRODUCTION && (
        <Tab
          value='templates'
          label={
            <Tooltip title='Template Library (Local only)'>
              <FolderOpen fontSize='small' />
            </Tooltip>
          }
        />
      )}
      <Tab
        value='images'
        label={
          <Tooltip title='Image Converter'>
            <ImageIcon fontSize='small' />
          </Tooltip>
        }
      />
    </Tabs>
  );
}
