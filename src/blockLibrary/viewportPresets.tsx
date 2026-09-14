import { Monitor, Smartphone, Tablet as TabletIcon } from "lucide-react";
import React from "react";

export interface ViewportPreset {
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
}

export const VIEWPORT_PRESETS: ViewportPreset[] = [
  { name: "Mobile S", width: 320, height: 568, icon: <Smartphone size={16} /> },
  { name: "Mobile M", width: 375, height: 667, icon: <Smartphone size={16} /> },
  { name: "Mobile L", width: 425, height: 812, icon: <Smartphone size={16} /> },
  { name: "Tablet", width: 768, height: 1024, icon: <TabletIcon size={16} /> },
  { name: "Laptop", width: 1024, height: 768, icon: <Monitor size={16} /> },
  { name: "Desktop", width: 1440, height: 900, icon: <Monitor size={16} /> },
];
