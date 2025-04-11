"use client";

import React from "react";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button"; // Corrected to named import

interface SaveOptionsProps {
  // Removed description and tags props
  handleSaveDesign: () => void;
  isSaving: boolean;
  status: "authenticated" | "loading" | "unauthenticated";
  handleReset?: () => void; // Make handleReset optional if not always passed
}

const SaveOptions: React.FC<SaveOptionsProps> = ({
  // Removed description and tags from destructuring
  handleSaveDesign,
  isSaving,
  status,
  handleReset,
}) => {
  return (
    <>
      {/* Action Buttons - Removed outer div wrapper */}
      <motion.button
        onClick={handleSaveDesign}
        disabled={isSaving || status !== "authenticated"}
        className={cn(
          "w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2",
          status !== "authenticated"
            ? "bg-gray-600 text-gray-400 cursor-not-allowed" // Disabled style
            : isSaving
            ? "bg-gray-600 text-gray-400 cursor-wait" // Saving style
            : "bg-white text-black hover:opacity-90" // Active style (white bg, black text)
        )}
        whileHover={{
          scale: status === "authenticated" && !isSaving ? 1.03 : 1,
        }} // Only scale if active
        whileTap={{
          scale: status === "authenticated" && !isSaving ? 0.98 : 1,
        }} // Only tap if active
      >
        {isSaving ? (
          <>
            <motion.div
              className="w-4 h-4 border-2 border-t-transparent border-black rounded-full" // Spinner border black
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Saving...
          </>
        ) : status !== "authenticated" ? (
          "Log in to Save"
        ) : (
          <>
            <Save size={18} /> Save Design
          </>
        )}
      </motion.button>
      {status !== "authenticated" && (
        <p className="text-xs text-center text-yellow-400">
          Please log in to save designs.
        </p>
      )}
      {/* Add other buttons like Reset, Share if needed */}
      {handleReset && ( // Conditionally render Reset button
        <Button
          onClick={handleReset}
          className="w-full text-sm py-2 bg-zinc-800 text-white border border-zinc-600 hover:bg-zinc-700 rounded-md transition-colors" // Use zinc theme, added rounded-md
        >
          Reset Design
        </Button>
      )}
      {/* Removed outer div wrapper */}
    </>
  );
};

export default SaveOptions;
