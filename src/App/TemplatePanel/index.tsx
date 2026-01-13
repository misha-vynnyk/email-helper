import React from "react";

import { Box, Stack } from "@mui/material";

import { BlockLibrary } from "../../blockLibrary";
import { useSelectedMainTab } from "../../contexts/AppState";
import { EmailSenderProvider } from "../../emailSender/EmailSenderContext";
import { ImageConverterPanel } from "../../imageConverter";
import { TemplateLibrary } from "../../templateLibrary";
import ToggleSamplesPanelButton from "../SamplesDrawer/ToggleSamplesPanelButton";

import EmailSenderPanel from "./EmailSenderPanel";
import MainTabsGroup from "./MainTabsGroup";

export default function TemplatePanel() {
  const selectedMainTab = useSelectedMainTab();

  const renderMainPanel = () => {
    switch (selectedMainTab) {
      case "email":
        return <EmailSenderPanel />;
      case "blocks":
        return <BlockLibrary />;
      case "templates":
        return (
          <EmailSenderProvider>
            <TemplateLibrary />
          </EmailSenderProvider>
        );
      case "images":
        return <ImageConverterPanel />;
      default:
        return <EmailSenderPanel />;
    }
  };

  return (
    <>
      <Stack
        sx={{
          height: 49,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "white",
          position: "sticky",
          top: 0,
          zIndex: "appBar",
          px: 1,
        }}
        direction='row'
        justifyContent='space-between'
        alignItems='center'
      >
        <Box sx={{ minWidth: 40 }}>
          <ToggleSamplesPanelButton />
        </Box>
        <Stack
          px={2}
          direction='row'
          width='100%'
          justifyContent='center'
          alignItems='center'
        >
          <MainTabsGroup />
        </Stack>
        <Box sx={{ minWidth: 40 }} />
      </Stack>
      <Box sx={{ height: "calc(100vh - 49px)", overflow: "hidden", minWidth: 370 }}>
        {renderMainPanel()}
      </Box>
    </>
  );
}
