import React from "react";

import { Box, Container, Paper } from "@mui/material";

import { ImageConverterProvider } from "../context/ImageConverterContext";

import AutoConvertToggle from "./AutoConvertToggle";
import BatchProcessor from "./BatchProcessor";
import ConversionSettings from "./ConversionSettings";
import FileUploadZone from "./FileUploadZone";
import ProcessingModeToggle from "./ProcessingModeToggle";

function ImageConverterContent() {
  return (
    <Container
      maxWidth='lg'
      sx={{ py: 3, height: "100%", overflow: "auto" }}
    >
      <Box
        mb={2}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: { xs: "stretch", md: "space-between" },
          gap: 3,
        }}
      >
        {/* Auto-Convert Toggle */}
        <AutoConvertToggle />

        {/* Processing Mode */}
        <Paper
          elevation={2}
          sx={{ p: 2, borderRadius: 5 }}
        >
          <ProcessingModeToggle />
        </Paper>
      </Box>

      <Box
        display='flex'
        flexDirection='column'
        gap={3}
      >
        {/* Upload Zone */}
        <FileUploadZone />

        {/* Batch Processor - Under upload zone */}
        <BatchProcessor />

        {/* Settings */}
        <ConversionSettings />
      </Box>
    </Container>
  );
}

export default function ImageConverterPanel() {
  return (
    <ImageConverterProvider>
      <ImageConverterContent />
    </ImageConverterProvider>
  );
}
