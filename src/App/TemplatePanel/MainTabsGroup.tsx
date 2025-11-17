import React from "react";

import { EmailOutlined, FolderOpen, Image as ImageIcon, ViewModule } from "@mui/icons-material";
import { Tab, Tabs, Tooltip } from "@mui/material";

import { setSelectedMainTab, useSelectedMainTab } from "../../contexts/AppState";

export default function MainTabsGroup() {
  const selectedMainTab = useSelectedMainTab();

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
      <Tab
        value='blocks'
        label={
          <Tooltip title='Block Library'>
            <ViewModule fontSize='small' />
          </Tooltip>
        }
      />
      <Tab
        value='templates'
        label={
          <Tooltip title='Template Library'>
            <FolderOpen fontSize='small' />
          </Tooltip>
        }
      />
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
