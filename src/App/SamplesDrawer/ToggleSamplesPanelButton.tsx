import { FirstPageOutlined, MenuOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { toggleSamplesDrawerOpen, useSamplesDrawerOpen } from "../../contexts/AppState";

function useIcon() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  if (samplesDrawerOpen) {
    return <FirstPageOutlined fontSize='small' />;
  }
  return <MenuOutlined fontSize='small' />;
}

export default function ToggleSamplesPanelButton() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const icon = useIcon();

  return (
    <Tooltip title={samplesDrawerOpen ? "Close menu" : "Open menu"}>
      <IconButton onClick={toggleSamplesDrawerOpen}>{icon}</IconButton>
    </Tooltip>
  );
}
