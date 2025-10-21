import React, { createContext, useCallback, useContext, useState } from 'react';

import {
  DEFAULT_AUTO_CONVERT,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_COMPRESSION_MODE,
  DEFAULT_FORMAT,
  DEFAULT_PROCESSING_MODE,
  DEFAULT_QUALITY,
} from '../constants';
import { ConversionResult, ConversionSettings, ImageFile, ImageFormat } from '../types';
import { convertImageClient } from '../utils/clientConverter';
import { convertImageServer } from '../utils/imageConverterApi';

interface ImageConverterContextType {
  files: ImageFile[];
  settings: ConversionSettings;
  updateSettings: (settings: Partial<ConversionSettings>) => void;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  convertFile: (id: string) => Promise<void>;
  convertAll: () => void;
  downloadFile: (id: string) => void;
  downloadAll: () => void;
}

const ImageConverterContext = createContext<ImageConverterContextType | undefined>(undefined);

export const useImageConverter = () => {
  const context = useContext(ImageConverterContext);
  if (!context) {
    throw new Error('useImageConverter must be used within ImageConverterProvider');
  }
  return context;
};

export const ImageConverterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<ConversionSettings>({
    format: DEFAULT_FORMAT,
    quality: DEFAULT_QUALITY,
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    resize: {
      mode: 'original',
      preserveAspectRatio: true,
    },
    processingMode: DEFAULT_PROCESSING_MODE,
    compressionMode: DEFAULT_COMPRESSION_MODE,
    autoConvert: DEFAULT_AUTO_CONVERT,
  });
  const [conversionQueue, setConversionQueue] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const filesRef = React.useRef<ImageFile[]>([]);

  // Keep filesRef in sync with files
  React.useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const updateSettings = useCallback((newSettings: Partial<ConversionSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const convertFile = useCallback(
    async (id: string) => {
      // Get file from ref (always current)
      const fileToConvert = filesRef.current.find((f) => f.id === id);

      if (!fileToConvert) {
        return;
      }

      // Check if already processing or done
      if (fileToConvert.status === 'done' || fileToConvert.status === 'processing') {
        return;
      }

      // Update status to processing
      setFiles((currentFiles) =>
        currentFiles.map((f) => (f.id === id ? { ...f, status: 'processing' as const, progress: 0 } : f))
      );

      try {
        // Progress callback to update UI
        const onProgress = (progress: number) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, progress: Math.min(Math.max(progress, 0), 100) } : f))
          );
        };

        // Simulate progress for better UX
        onProgress(10);

        let result: ConversionResult;

        if (settings.processingMode === 'client') {
          onProgress(30);
          result = await convertImageClient(fileToConvert!.file, settings);
          onProgress(90);
        } else {
          onProgress(20);
          const blob = await convertImageServer(fileToConvert!.file, settings);
          onProgress(80);
          result = { blob, size: blob.size };
        }

        const convertedUrl = URL.createObjectURL(result.blob);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: 'done' as const,
                  progress: 100,
                  convertedBlob: result.blob,
                  convertedSize: result.size,
                  convertedUrl,
                }
              : f
          )
        );
      } catch (error) {
        console.error('Conversion error:', error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Conversion failed',
                }
              : f
          )
        );
      }
    },
    [settings]
  );

  // Process conversion queue sequentially
  React.useEffect(() => {
    if (isProcessing || conversionQueue.length === 0) return;

    const processNext = async () => {
      setIsProcessing(true);
      const nextId = conversionQueue[0];

      await convertFile(nextId);

      // Remove processed file from queue
      setConversionQueue((prev) => prev.slice(1));
      setIsProcessing(false);
    };

    processNext();
  }, [conversionQueue, isProcessing, convertFile]);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const imageFiles: ImageFile[] = newFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        originalSize: file.size,
        status: 'pending',
        progress: 0,
        previewUrl: URL.createObjectURL(file),
      }));

      setFiles((prev) => [...prev, ...imageFiles]);

      // Auto-convert if enabled - add to queue after state update
      if (settings.autoConvert) {
        const newIds = imageFiles.map((f) => f.id);
        // Use setTimeout to ensure files state is updated first
        setTimeout(() => {
          setConversionQueue((prev) => [...prev, ...newIds]);
        }, 50);
      }
    },
    [settings.autoConvert]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      if (file?.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles((currentFiles) => {
      currentFiles.forEach((file) => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        if (file.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
      });
      return [];
    });
  }, []);

  const convertAll = useCallback(() => {
    // Get pending files and add to queue
    setFiles((currentFiles) => {
      const pendingIds = currentFiles.filter((f) => f.status === 'pending').map((f) => f.id);
      if (pendingIds.length > 0) {
        // Delay to ensure state is consistent
        setTimeout(() => {
          setConversionQueue((prev) => [...prev, ...pendingIds]);
        }, 10);
      }
      return currentFiles;
    });
  }, []);

  const downloadFile = useCallback(
    (id: string) => {
      setFiles((currentFiles) => {
        const file = currentFiles.find((f) => f.id === id);
        if (!file?.convertedBlob) return currentFiles;

        const extension = getExtensionForFormat(settings.format);
        const filename = file.file.name.replace(/\.[^/.]+$/, '') + extension;

        const url = URL.createObjectURL(file.convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return currentFiles;
      });
    },
    [settings.format]
  );

  const downloadAll = useCallback(() => {
    setFiles((currentFiles) => {
      const completedFiles = currentFiles.filter((f) => f.status === 'done' && f.convertedBlob);
      completedFiles.forEach((file) => downloadFile(file.id));
      return currentFiles;
    });
  }, [downloadFile]);

  const contextValue: ImageConverterContextType = {
    files,
    settings,
    updateSettings,
    addFiles,
    removeFile,
    clearFiles,
    convertFile,
    convertAll,
    downloadFile,
    downloadAll,
  };

  return <ImageConverterContext.Provider value={contextValue}>{children}</ImageConverterContext.Provider>;
};

function getExtensionForFormat(format: ImageFormat): string {
  switch (format) {
    case 'jpeg':
      return '.jpg';
    case 'webp':
      return '.webp';
    case 'avif':
      return '.avif';
    case 'png':
      return '.png';
    default:
      return '.jpg';
  }
}
