"use client";

import React from "react";
import * as THREE from "three";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // Corrected to named import
import UploadClearButtons from "./upload-clear-buttons"; // Use the extracted component

interface TextureControlsProps {
  isLogoMode: boolean;
  // Logo Props
  logoTargetPart: "front" | "back";
  setLogoTargetPart: (part: "front" | "back") => void;
  logoScale: number;
  setLogoScale: (scale: number) => void;
  logoOffset: THREE.Vector2;
  setLogoOffset: (
    offset: THREE.Vector2 | ((prev: THREE.Vector2) => THREE.Vector2)
  ) => void;
  uploadedLogoTexture: THREE.Texture | null;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // clearUploadedLogo: () => void; // Prop removed
  // fileInputRef: React.RefObject<HTMLInputElement | null>; // Prop removed
  offsetXMin: number;
  offsetXMax: number;
  // Pattern Props
  uploadedPatternTexture: THREE.Texture | null;
  handlePatternUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // clearUploadedPattern: () => void; // Prop removed
  // patternFileInputRef: React.RefObject<HTMLInputElement | null>; // Prop removed
}

const TextureControls: React.FC<TextureControlsProps> = ({
  isLogoMode,
  // Logo Props
  logoTargetPart,
  setLogoTargetPart,
  logoScale,
  setLogoScale,
  logoOffset,
  setLogoOffset,
  uploadedLogoTexture,
  // handleImageUpload, // Removed unused prop
  // clearUploadedLogo, // Prop removed
  // fileInputRef, // Prop removed
  offsetXMin,
  offsetXMax,
  // Pattern Props
  uploadedPatternTexture,
  // handlePatternUpload, // Removed unused prop
  // clearUploadedPattern, // Prop removed
  // patternFileInputRef, // Prop removed
}) => {
  return (
    // Adjust responsive spacing
    <div className="space-y-2 sm:space-y-4 pt-4 border-t border-white/10">
      {isLogoMode ? (
        // Logo Controls
        // Adjust responsive spacing
        <div className="space-y-2 sm:space-y-3">
          {/* UploadClearButtons removed from here */}
          {/* Logo Placement Controls */}
          {uploadedLogoTexture && (
            <>
              {/* Stack buttons vertically on mobile, row on sm+ */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setLogoTargetPart("front")}
                  className={`flex-1 text-xs py-1.5 border rounded-md transition-colors ${
                    // Keep flex-1 for sm+ screens
                    // Added rounded-md and py-1.5
                    logoTargetPart === "front"
                      ? "bg-white text-black border-white" // Active: White bg, black text
                      : "bg-zinc-800 text-white border-zinc-600 hover:bg-zinc-700" // Inactive: Zinc bg, white text, zinc border/hover
                  }`}
                >
                  Front
                </Button>
                <Button
                  onClick={() => setLogoTargetPart("back")}
                  className={`flex-1 text-xs py-1.5 border rounded-md transition-colors ${
                    // Added rounded-md and py-1.5
                    logoTargetPart === "back"
                      ? "bg-white text-black border-white" // Active: White bg, black text
                      : "bg-zinc-800 text-white border-zinc-600 hover:bg-zinc-700" // Inactive: Zinc bg, white text, zinc border/hover
                  }`}
                >
                  Back
                </Button>
              </div>
              {/* Logo Scale Slider */}
              <div>
                <Label
                  htmlFor="logo-scale"
                  className="block text-xs font-medium text-gray-300 mb-1"
                >
                  Scale: {logoScale.toFixed(2)}
                </Label>
                <input
                  id="logo-scale"
                  type="range"
                  min="0.01"
                  max="0.5" // Adjust max scale as needed
                  step="0.01"
                  value={logoScale}
                  onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
              {/* Logo Offset X Slider */}
              <div>
                <Label
                  htmlFor="logo-offset-x"
                  className="block text-xs font-medium text-gray-300 mb-1"
                >
                  Offset X: {logoOffset.x.toFixed(3)}
                </Label>
                <input
                  id="logo-offset-x"
                  type="range"
                  min={offsetXMin}
                  max={offsetXMax}
                  step="0.001"
                  value={logoOffset.x}
                  onChange={(e) => {
                    const newX = parseFloat(e.target.value);
                    setLogoOffset((prev) => new THREE.Vector2(newX, prev.y));
                  }}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
              {/* Logo Offset Y Slider */}
              <div>
                <Label
                  htmlFor="logo-offset-y"
                  className="block text-xs font-medium text-gray-300 mb-1"
                >
                  Offset Y: {logoOffset.y.toFixed(3)}
                </Label>
                <input
                  id="logo-offset-y"
                  type="range"
                  min="-0.2" // Adjust min/max as needed for Y offset
                  max="0.2"
                  step="0.001"
                  value={logoOffset.y}
                  onChange={(e) => {
                    const newY = parseFloat(e.target.value);
                    setLogoOffset((prev) => new THREE.Vector2(prev.x, newY));
                  }}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </>
          )}
        </div>
      ) : (
        // Pattern Controls
        // Adjust responsive spacing
        <div className="space-y-2 sm:space-y-3">
          {/* UploadClearButtons removed from here */}
          {/* Add pattern-specific controls here if needed in the future */}
        </div>
      )}
    </div>
  );
};

export default TextureControls;
