"use client";

import React from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button"; // Corrected to named import

// Helper component for Upload/Clear button pairs
interface UploadClearButtonsProps {
  label: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadedTexture: THREE.Texture | null;
  clearHandler: () => void;
}

const UploadClearButtons: React.FC<UploadClearButtonsProps> = ({
  label,
  fileInputRef,
  uploadedTexture,
  clearHandler,
}) => (
  <div className="flex flex-col sm:flex-row gap-2 items-center">
    <span className="text-xs text-gray-300 w-full sm:w-1/4">{label}:</span>
    {/* Stack buttons vertically on mobile, row on sm+ */}
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-3/4">
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="flex-1 text-xs py-1.5 bg-zinc-800 text-white border border-zinc-600 hover:bg-zinc-700 transition-colors rounded-md" // Keep flex-1 for sm+
      >
        Upload
      </Button>
      {uploadedTexture && (
        <Button
          onClick={clearHandler}
          className="flex-1 text-xs py-1.5 bg-zinc-600 hover:bg-zinc-500 border-transparent text-white transition-colors rounded-md" // Use zinc shades, added rounded-md
        >
          Clear
        </Button>
      )}
    </div>
  </div>
);

export default UploadClearButtons;
