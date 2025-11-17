import React from "react";

import { MonitorOutlined, PhoneIphoneOutlined } from "@mui/icons-material";
import { Box, Stack, SxProps, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";

import { BlockLibrary } from "../../blockLibrary";
import {
  setSelectedScreenSize,
  useSelectedMainTab,
  useSelectedScreenSize,
} from "../../contexts/AppState";
import { EmailSenderProvider } from "../../emailSender/EmailSenderContext";
import { ImageConverterPanel } from "../../imageConverter";
import { TemplateLibrary } from "../../templateLibrary";
import ToggleSamplesPanelButton from "../SamplesDrawer/ToggleSamplesPanelButton";

import EmailSenderPanel from "./EmailSenderPanel";
import MainTabsGroup from "./MainTabsGroup";

export default function TemplatePanel() {
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();

  let mainBoxSx: SxProps = {
    height: "100%",
  };
  if (selectedScreenSize === "mobile") {
    mainBoxSx = {
      ...mainBoxSx,
      margin: "32px auto",
      width: 370,
      height: 800,
      boxShadow:
        "rgba(33, 36, 67, 0.04) 0px 10px 20px, rgba(33, 36, 67, 0.04) 0px 2px 6px, rgba(33, 36, 67, 0.04) 0px 0px 1px",
    };
  }

  const handleScreenSizeChange = (_: React.SyntheticEvent, value: "mobile" | "desktop") => {
    if (value === "mobile" || value === "desktop") {
      setSelectedScreenSize(value);
    } else {
      setSelectedScreenSize("desktop");
    }
  };

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
        <ToggleSamplesPanelButton />
        <Stack
          px={2}
          direction='row'
          gap={2}
          width='100%'
          justifyContent='space-between'
          alignItems='center'
        >
          <Stack
            direction='row'
            spacing={2}
          >
            <MainTabsGroup />
          </Stack>
          <Stack
            direction='row'
            spacing={2}
          >
            <ToggleButtonGroup
              value={selectedScreenSize}
              exclusive
              size='small'
              onChange={handleScreenSizeChange}
            >
              <ToggleButton value='desktop'>
                <Tooltip title='Desktop view'>
                  <MonitorOutlined fontSize='small' />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value='mobile'>
                <Tooltip title='Mobile view'>
                  <PhoneIphoneOutlined fontSize='small' />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Stack>
      <Box sx={{ height: "calc(100vh - 49px)", overflow: "hidden", minWidth: 370 }}>
        {renderMainPanel()}
      </Box>
    </>
  );
}
