"use client";

import React from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button"; // Corrected to named import

interface ModeToggleProps {
  isLogoMode: boolean;
  toggleMode: () => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ isLogoMode, toggleMode }) => {
  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <Button
        onClick={toggleMode}
        className="w-full py-2 px-4 bg-zinc-800 text-white border border-zinc-600 rounded-md hover:bg-zinc-700 transition-colors duration-300 text-sm flex items-center justify-center gap-2" // Use zinc shades
      >
        <Wand2 size={16} />
        Switch to {isLogoMode ? "Pattern Mode" : "Logo Mode"}
      </Button>
    </div>
  );
};

export default ModeToggle;
