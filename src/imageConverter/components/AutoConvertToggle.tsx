import React from 'react';

import { AutoMode as AutoIcon, PanTool as ManualIcon } from '@mui/icons-material';
import { Box, FormControlLabel, Paper, Switch, Typography } from '@mui/material';

import { useImageConverter } from '../context/ImageConverterContext';

export default function AutoConvertToggle() {
  const { settings, updateSettings } = useImageConverter();

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 5,
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={settings.autoConvert}
            onChange={(e) => updateSettings({ autoConvert: e.target.checked })}
            color="primary"
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={1}>
            {settings.autoConvert ? <AutoIcon color="primary" /> : <ManualIcon />}
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {settings.autoConvert ? 'Auto-Convert Mode' : 'Manual Mode'}
              </Typography>
            </Box>
          </Box>
        }
      />
    </Paper>
  );
}
