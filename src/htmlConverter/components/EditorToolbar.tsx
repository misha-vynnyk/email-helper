import { Button, Stack } from "@mui/material";
import { SwapHoriz as ConvertIcon, Download as DownloadIcon } from "@mui/icons-material";
import { spacingMUI } from "../../theme/tokens";
import { StyledPaper } from "./StyledPaper";

interface EditorToolbarProps {
  onExportHTML: () => void;
  onExportMJML: () => void;
  onAutoExportAll: () => void;
  isAutoExporting: boolean;
  sx?: any;
}

export function EditorToolbar({ onExportHTML, onExportMJML, onAutoExportAll, isAutoExporting, sx }: EditorToolbarProps) {
  return (
    <StyledPaper sx={sx}>
      <Stack direction='row' spacing={spacingMUI.sm} flexWrap='wrap' alignItems='center'>
        <Button variant='contained' size='small' onClick={onExportHTML} startIcon={<ConvertIcon />} disabled={isAutoExporting} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
          Експортувати HTML
        </Button>
        <Button variant='contained' size='small' onClick={onExportMJML} startIcon={<ConvertIcon />} disabled={isAutoExporting} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
          Експортувати MJML
        </Button>
        <Button variant='contained' size='small' onClick={onAutoExportAll} startIcon={<DownloadIcon fontSize='small' />} disabled={isAutoExporting} sx={{ textTransform: "none", whiteSpace: "nowrap", ml: "auto" }}>
          {isAutoExporting ? "Готую..." : "Зробити все"}
        </Button>
      </Stack>
    </StyledPaper>
  );
}
