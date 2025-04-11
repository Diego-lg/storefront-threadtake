"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/libs/utils";
import { Color } from "@/types";

// Define the fallback color palette if needed
const COLOR_PALETTE = {
  white: "#FFFFFF",
  black: "#222222",
  red: "#D32F2F",
  blue: "#1976D2",
  grey: "#757575",
};

interface ColorPickerProps {
  availableColors: Color[] | null;
  shirtColor: string;
  setShirtColor: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  availableColors,
  shirtColor,
  setShirtColor,
}) => {
  return (
    <div className="mt-4">
      <span className="block text-sm font-medium text-gray-300 mb-2">
        Shirt Color:
      </span>
      <div className="flex flex-wrap gap-2">
        {availableColors
          ? availableColors.map((colorItem: Color) => {
              // Normalize color values for comparison
              const normalizedShirtColor = shirtColor.trim().toLowerCase();
              const normalizedItemValue = colorItem.value.trim().toLowerCase();
              const isSelected = normalizedShirtColor === normalizedItemValue;

              return (
                <motion.button
                  key={colorItem.id}
                  onClick={() => setShirtColor(colorItem.value)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all duration-200 ease-in-out transform hover:scale-110",
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-gray-900 ring-white border-white" // Selected style (white ring/border)
                      : "border-gray-600 hover:border-gray-400" // Default style (gray border)
                  )}
                  style={{ backgroundColor: colorItem.value }}
                  aria-label={`Set color to ${colorItem.name}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Optional: Add a checkmark for selected */}
                  {/* {isSelected && <Check className="w-4 h-4 text-white mix-blend-difference" />} */}
                </motion.button>
              );
            })
          : Object.entries(COLOR_PALETTE).map(([name, value]) => {
              // Fallback rendering using COLOR_PALETTE
              const normalizedShirtColor = shirtColor.trim().toLowerCase();
              const normalizedValue = value.trim().toLowerCase();
              const isSelected = normalizedShirtColor === normalizedValue;

              return (
                <motion.button
                  key={name}
                  onClick={() => setShirtColor(value)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all duration-200 ease-in-out transform hover:scale-110",
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-gray-900 ring-white border-white" // Selected style (white ring/border)
                      : "border-gray-600 hover:border-gray-400" // Default style (gray border)
                  )}
                  style={{ backgroundColor: value }}
                  aria-label={`Set color to ${name}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Optional: Add a checkmark for selected */}
                </motion.button>
              );
            })}
      </div>
    </div>
  );
};

export default ColorPicker;
