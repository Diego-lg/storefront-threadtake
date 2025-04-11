"use client";

import React from "react";
import { Label } from "@/components/ui/label"; // Assuming Label is used or might be needed

interface TextOptionsProps {
  text: string;
  setText: (text: string) => void;
}

const TextOptions: React.FC<TextOptionsProps> = ({ text, setText }) => {
  return (
    <div>
      <Label
        htmlFor="custom-text-input" // Changed id to avoid potential conflicts if Label is used elsewhere
        className="block text-sm font-medium text-gray-300 mb-1"
      >
        Your Text
      </Label>
      <textarea
        id="custom-text-input"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to add to shirt..."
        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 resize-none" // Use updated gray/white theme
      />
      {/* Add controls for font, size, color later if needed */}
    </div>
  );
};

export default TextOptions;
