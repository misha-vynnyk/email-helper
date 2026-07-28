import { useCallback, useState } from "react";

import { figmaImportEndpoints } from "../api/endpoints/figmaImport";
import { validateDesignPair } from "./validate";
import type { ValidationResult } from "./validate";

interface FigmaImportFolderState {
  loading: boolean;
  error?: string;
  descriptionExists: boolean;
  description?: string;
  desktopRaw?: string;
  mobileRaw?: string;
  validation?: ValidationResult;
}

const initialState: FigmaImportFolderState = {
  loading: false,
  descriptionExists: false,
};

export function useFigmaImportFolder() {
  const [state, setState] = useState<FigmaImportFolderState>(initialState);

  const load = useCallback(async (folderPath: string) => {
    setState({ ...initialState, loading: true });

    try {
      const result = await figmaImportEndpoints.readFolder(folderPath);

      if (!result.desktopJson.exists || !result.mobileJson.exists) {
        setState({
          loading: false,
          descriptionExists: result.description.exists,
          description: result.description.content,
          error: !result.desktopJson.exists ? "desktop.json not found in folder" : "mobile.json not found in folder",
        });
        return;
      }

      const validation = validateDesignPair(result.desktopJson.content!, result.mobileJson.content!);

      setState({
        loading: false,
        descriptionExists: result.description.exists,
        description: result.description.content,
        desktopRaw: result.desktopJson.content,
        mobileRaw: result.mobileJson.content,
        validation,
      });
    } catch (error) {
      setState({
        ...initialState,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load folder",
      });
    }
  }, []);

  return { ...state, load };
}
