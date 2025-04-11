import { create } from "zustand";

// Define the shape of the configuration needed to load a design
// Adjust this based on exactly what state needs to be restored in TShirtDesigner
export interface DesignLoadConfig {
  productId: string;
  colorId: string;
  // colorValue: string; // Removed, use shirtColorHex
  sizeId: string;
  customText: string | null;
  // --- Add full configuration fields ---
  shirtColorHex?: string | null; // Add the hex color field
  isLogoMode?: boolean | null;
  logoScale?: number | null;
  logoOffsetX?: number | null;
  logoOffsetY?: number | null;
  logoTargetPart?: string | null; // "front" or "back"
  uploadedLogoUrl?: string | null;
  uploadedPatternUrl?: string | null;
}

interface DesignLoaderState {
  loadDesignConfig: DesignLoadConfig | null;
  setLoadDesignConfig: (config: DesignLoadConfig | null) => void;
}

export const useDesignLoaderStore = create<DesignLoaderState>((set) => ({
  loadDesignConfig: null,
  setLoadDesignConfig: (config) => set({ loadDesignConfig: config }),
}));
