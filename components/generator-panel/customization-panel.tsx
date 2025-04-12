"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Keep for potential future use? Or remove if only used in save
import * as THREE from "three"; // Keep THREE import for types
import { useSession } from "next-auth/react"; // Keep for status check? Or remove if only used in save
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axiosInstance"; // Keep for potential future use? Or remove if only used in save
import { isAxiosError } from "axios"; // Keep for potential future use? Or remove if only used in save
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence

import { Color } from "@/types";
import ColorPicker from "./color-picker";
// import ModeToggle from "./mode-toggle"; // No longer used directly here
import TextureControls from "./texture-controls";
import UploadClearButtons from "./upload-clear-buttons"; // Will be refactored or replaced
import ImageGenerator from "../image-generator/generator"; // Import for type checking if needed, or rely on prop

import MyDesignsList, { SavedDesign } from "./my-designs-list"; // Import the new component and type

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input"; // Needed for AI prompt
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { ChevronRight, UploadCloud, RefreshCw, Sparkles } from "lucide-react"; // Icons

// Helper function to convert Data URL to Blob (Keep if used elsewhere, e.g., preview?)
function dataURLtoBlob(dataurl: string): Blob | null {
  try {
    const arr = dataurl.split(",");
    if (!arr[0]) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (error) {
    console.error("Error converting data URL to Blob:", error);
    return null;
  }
}

interface CustomizationPanelProps {
  productId: string;
  sizeId: string;
  text: string;
  setText: (text: string) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
  handleScreenshot: () => void; // Keep for potential future use?
  getCanvasDataURL: () => string | null; // Keep for potential future use?
  resetCameraView?: () => void; // Keep for potential future use?
  handleReset?: () => void; // Keep for potential future use?
  handleShare?: () => void; // Keep for potential future use?
  activeTab: string;
  setActiveTab: (tab: string) => void;
  imageGeneratorComponent?: React.ReactNode;
  children?: React.ReactNode;

  // --- Unified Image Props ---
  activeImageTexture: THREE.Texture | null;
  activeImageUrl: string | null; // URL (blob or persistent)
  activeImageFile: File | null; // Pending file for upload
  clearActiveImage: () => void; // Unified clear handler
  setActiveImageFile: (file: File | null) => void; // Function to set the active file
  setActiveImageUrl: (url: string | null) => void; // Function to set the active image URL

  // --- Mode & Logo Specific Props ---
  isLogoMode: boolean;
  toggleMode: () => void;
  logoTargetPart: "front" | "back";
  setLogoTargetPart: (part: "front" | "back") => void;
  logoScale: number;
  setLogoScale: (scale: number) => void;
  logoOffset: THREE.Vector2;
  setLogoOffset: (
    offset: THREE.Vector2 | ((prev: THREE.Vector2) => THREE.Vector2)
  ) => void;
  offsetXMin: number;
  offsetXMax: number;

  // --- Refs for triggering uploads ---
  logoFileInputRef: React.RefObject<HTMLInputElement | null>;
  patternFileInputRef: React.RefObject<HTMLInputElement | null>;

  // --- Color Props ---
  shirtColor: string;
  setShirtColor: (color: string) => void;
  availableColors: Color[] | null;

  // --- Design Loading ---
  onDesignSelect: (design: SavedDesign) => void;

  // --- Size State (Lifted) ---
  selectedSize: string;
  setSelectedSize: (size: string) => void;

  // --- RMBG Original Input State (Passed from Parent) ---
  originalRmbgInputUrl: string | null;
  setOriginalRmbgInputUrl: React.Dispatch<React.SetStateAction<string | null>>;

  // Removed unused props comments
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = (props) => {
  const {
    productId,
    sizeId,
    getCanvasDataURL, // Keep prop for now
    text,
    setText,
    isGenerating,
    handleGenerate,
    handleScreenshot, // Keep prop for now
    activeTab,
    setActiveTab,
    children,
    // --- Unified Image Props ---
    activeImageTexture,
    activeImageUrl,
    activeImageFile,
    clearActiveImage,
    setActiveImageFile, // Added prop
    setActiveImageUrl, // Added prop
    // --- Mode & Logo Specific Props ---
    isLogoMode,
    toggleMode,
    logoTargetPart,
    setLogoTargetPart,
    logoScale,
    setLogoScale,
    logoOffset,
    setLogoOffset,
    offsetXMin,
    offsetXMax,
    // --- Refs ---
    logoFileInputRef,
    patternFileInputRef,
    // --- Color Props ---
    shirtColor,
    setShirtColor,
    availableColors,
    // --- Design Loading ---
    onDesignSelect,
    // --- Other Props ---
    resetCameraView, // Keep prop for now
    handleReset, // Keep prop for now
    handleShare, // Keep prop for now
    imageGeneratorComponent,
    // --- Size State (Lifted) ---
    selectedSize,
    setSelectedSize,
    // --- RMBG Original Input State ---
    originalRmbgInputUrl,
    setOriginalRmbgInputUrl,
  } = props;

  const { data: session, status } = useSession(); // Keep for potential future use?
  // Removed isSaving state

  // State for background removal
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [rmbgResults, setRmbgResults] = useState<string[]>([]);
  const [selectedRmbgIndex, setSelectedRmbgIndex] = useState<number | null>(
    null
  );
  // Removed local state for originalRmbgInputUrl as it's now passed via props

  // Animation variants for tab content
  const tabVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: 10, transition: { duration: 0.2 } },
  };

  // Removed uploadFileToR2 function
  // Removed handleSaveDesign function

  // Handles file input change for both logo and pattern.
  // Assumes parent component will handle the state update based on the ref trigger.
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOriginalRmbgInputUrl(null); // Clear previous original URL on new upload

    const file = e.target.files?.[0];
    if (file) {
      console.log("Image selected via input change:", file.name);

      // Assume setActiveImageFile and setActiveImageUrl are passed as props
      // TODO: Ensure these props are passed from the parent component (TshirtPanel)
      if (setActiveImageFile && setActiveImageUrl) {
        setActiveImageFile(file); // Update the file state

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const imageUrl = event.target.result as string;
            console.log(
              "FileReader result (Data URL):",
              imageUrl.substring(0, 100) + "..."
            ); // Log start of URL
            setActiveImageUrl(imageUrl); // Update the URL state (triggers texture update in parent)
          } else {
            console.error("FileReader failed to read the file.");
            toast.error("Failed to read image file.");
            setActiveImageFile(null); // Clear file state on error
          }
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          toast.error("Error reading image file.");
          setActiveImageFile(null); // Clear file state on error
        };
        reader.readAsDataURL(file); // Read the file as Data URL
      } else {
        console.error(
          "setActiveImageFile or setActiveImageUrl prop is missing!"
        );
        toast.error("Internal configuration error: Cannot update image.");
      }
    } else {
      console.log("No file selected or selection cancelled.");
    }
  };

  // Function to handle background removal request
  const handleRemoveBackground = async () => {
    // DEBUG: Log the state of activeImageUrl when the function starts
    console.log(
      `[DEBUG] handleRemoveBackground started. activeImageUrl: ${activeImageUrl}`
    );
    console.log("handleRemoveBackground called"); // DEBUG: Check if function is entered
    // Allow proceeding if either a file OR any image URL exists
    if (!activeImageFile && !activeImageUrl) {
      toast.error("Please upload or select an image first.");
      console.log("Exiting handleRemoveBackground: No image source found."); // DEBUG
      return;
    }
    console.log("Image source found. Proceeding...", {
      activeImageFile,
      activeImageUrl,
    }); // DEBUG

    setIsRemovingBackground(true);
    setRmbgResults([]); // Clear previous results
    setOriginalRmbgInputUrl(activeImageUrl); // Store the URL before starting

    setSelectedRmbgIndex(null);
    toast.loading("Removing background...", { id: "rmbg-toast" });

    let imageBlob: Blob | null = null;

    try {
      // Wrap blob retrieval in try/catch
      if (activeImageFile) {
        imageBlob = activeImageFile;
        console.log("[DEBUG] Using activeImageFile for background removal.");
        console.log("[DEBUG] imageBlob (from file):", imageBlob);
      } else if (activeImageUrl?.startsWith("data:image")) {
        // Convert data URL back to Blob if needed
        console.log(
          "[DEBUG] Converting data: URL to Blob for background removal."
        );
        imageBlob = dataURLtoBlob(activeImageUrl);
        console.log("[DEBUG] imageBlob (from dataURL):", imageBlob);
        if (!imageBlob) {
          throw new Error("Failed to convert data URL to Blob.");
        }
      } else if (activeImageUrl?.startsWith("blob:")) {
        // Fetch the blob data from the blob URL
        console.log(
          "[DEBUG] Fetching Blob from blob: URL for background removal."
        );
        const response = await fetch(activeImageUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch blob: URL (status: ${response.status})`
          );
        }
        imageBlob = await response.blob();
        console.log("[DEBUG] imageBlob (from blob: URL):", imageBlob);
      } else if (activeImageUrl?.startsWith("http")) {
        // Handle standard HTTP(S) URLs (e.g., from generator)
        console.log(
          "[DEBUG] Fetching image from standard URL:",
          activeImageUrl
        );
        const response = await fetch(activeImageUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch image from URL: ${response.status} ${response.statusText}`
          );
        }
        imageBlob = await response.blob();
        console.log("[DEBUG] imageBlob (from http URL):", imageBlob);
      } else {
        // If it's not a file, data URL, blob URL, or http(s) URL, it's unsupported
        console.error("[DEBUG] Unsupported image source:", activeImageUrl);
        throw new Error("Unsupported image source for background removal.");
      }

      // --- Final check before creating FormData ---
      if (!imageBlob) {
        // This check catches cases where blob creation failed silently or wasn't attempted
        throw new Error(
          "Could not obtain valid image data for background removal."
        );
      }

      const formData = new FormData();
      // Use a consistent filename for the server
      const filename = "image.png"; // Simplified filename
      // DEBUG: Log the final blob object right before appending
      console.log("[DEBUG] Final imageBlob before append:", imageBlob);
      console.log(
        `Appending blob to FormData: size=${imageBlob.size}, type=${imageBlob.type}, filename=${filename}`
      ); // DEBUG: Log blob details
      formData.append("image", imageBlob, filename);

      console.log(
        "Initiating background removal request with fetched/converted Blob..."
      ); // DEBUG

      // --- Axios request ---
      // Point to rembg.py endpoint (port 5002) and expect JSON with node keys
      axiosInstance
        .post<{
          // Expect the JSON object with node keys
          [nodeId: string]: {
            filename?: string;
            image_data_base64?: string;
            error?: string;
          };
        }>(
          `${process.env.NEXT_PUBLIC_REMBG_API_URL}/remove-background`, // Use env variable
          formData, // Send FormData
          {
            headers: {
              "Content-Type": "multipart/form-data", // Explicitly set header
            },
            timeout: 120000, // 120 seconds timeout
          }
        )
        .then((response) => {
          console.log(
            "Request successful (.then block). Response data:",
            response.data
          ); // DEBUG
          // Check if the response data is a valid object with node keys
          if (
            response?.data &&
            typeof response.data === "object" &&
            Object.keys(response.data).length > 0
          ) {
            console.log("Response data is valid object. Processing results..."); // DEBUG
            const processedResults: string[] = [];
            // Define the expected order based on the rembg.py script's output nodes
            // (Assuming rembg.py uses nodes 20, 26, 27 from FAST_RMBG.json)
            const expectedNodeOrder = ["node_20", "node_26", "node_27"];

            expectedNodeOrder.forEach((nodeKey) => {
              const nodeData = response.data[nodeKey];
              if (nodeData && nodeData.image_data_base64) {
                // Construct the data URL
                const dataUrl = `data:image/png;base64,${nodeData.image_data_base64}`;
                processedResults.push(dataUrl);
                console.log(`Processed result for ${nodeKey}`); // DEBUG
              } else {
                console.warn(
                  `No image_data_base64 found for node ${nodeKey}`,
                  nodeData
                );
                // Optionally add a placeholder or skip this result
              }
            });

            if (processedResults.length > 0) {
              try {
                setRmbgResults(processedResults); // Update state with the array of data URLs
                setSelectedRmbgIndex(null); // Reset selection
                console.log(
                  "rmbgResults state updated with multiple data URLs."
                ); // DEBUG
              } catch (stateError) {
                console.error("Error setting rmbgResults state:", stateError); // DEBUG
              }
              toast.success("Background removed! Select a result.", {
                id: "rmbg-toast",
              });
              console.log("Success path finished."); // DEBUG
            } else {
              console.error(
                "No valid base64 image data found in any node results:",
                response.data
              );
              setRmbgResults([]); // Clear results
              toast.error(
                "Failed to get valid image data from background removal.",
                { id: "rmbg-toast" }
              );
              console.log("No valid image data path finished."); // DEBUG
            }
          } else {
            console.error(
              "Invalid or empty response data object from background removal API:",
              response?.data
            );
            setRmbgResults([]); // Clear results
            toast.error(
              "Failed to get valid results from background removal.",
              {
                id: "rmbg-toast",
              }
            );
            console.log("Invalid response data object path finished."); // DEBUG
          }
        })
        .catch((error) => {
          console.error("Error removing background (.catch block):", error); // DEBUG
          // Log more details for Axios errors
          if (isAxiosError(error)) {
            console.error("Axios error details:", {
              message: error.message,
              code: error.code,
              status: error.response?.status,
              data: error.response?.data,
              config: error.config, // Log request config
            });
          } else {
            console.error("Non-Axios error:", error);
          }

          let errorMessage = "Failed to remove background.";
          if (isAxiosError(error)) {
            if (error.code === "ECONNABORTED") {
              errorMessage = "Request timed out. Please try again.";
            } else if (error.response?.data?.error) {
              // Use server-provided error if available
              errorMessage = `Server error: ${error.response.data.error}`;
            } else if (error.response?.status) {
              // Generic HTTP error
              errorMessage = `HTTP Error: ${error.response.status}`;
            } else if (error.request) {
              // Request made but no response received
              errorMessage = "No response received from server.";
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          setRmbgResults([]); // Clear results on error
          toast.error(errorMessage, { id: "rmbg-toast" });
          console.log("Catch path finished. Error Message:", errorMessage); // DEBUG with message
        })
        .finally(() => {
          console.log(
            "Request finished (.finally block). Setting loading state to false."
          ); // DEBUG
          setIsRemovingBackground(false); // Ensure loading state is always reset
        });
    } catch (error) {
      // Catch errors from blob retrieval/conversion
      console.error("Error preparing image blob:", error);
      toast.error((error as Error).message || "Could not get image data.", {
        id: "rmbg-toast",
      });
      setIsRemovingBackground(false);
      return; // Stop execution
    }
    // The .finally block will still run if an error occurred before the axios call
  };

  // Reuses the same logic for pattern upload for now.
  const handlePatternUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If different logic is needed for patterns vs logos based on file input change,
    // implement it here. Otherwise, reuse handleImageUpload.
    handleImageUpload(e);
  };

  // Removed handleLoadDesign function stub

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-none rounded-none bg-card text-card-foreground ">
      {/* Hidden file inputs remain */}
      <input
        type="file"
        ref={logoFileInputRef as React.RefObject<HTMLInputElement>}
        onChange={handleImageUpload} // Kept onChange, see handler comments
        style={{ display: "none" }}
        accept="image/*"
      />
      <input
        type="file"
        ref={patternFileInputRef as React.RefObject<HTMLInputElement>}
        onChange={handlePatternUpload} // Kept onChange, see handler comments
        style={{ display: "none" }}
        accept="image/*"
      />

      <CardHeader className="px-2 md:px-4 pt-2 pb-0 md:pt-4">
        <CardTitle className="text-xl md:text-2xl font-bold">
          MONO STUDIO
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Create your minimalist masterpiece
        </CardDescription>
      </CardHeader>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex-grow flex flex-col"
      >
        <CardContent className="pb-0 px-2 md:px-4 pt-2 md:pt-4">
          {/* Updated Tabs List - Removed Style, adjusted grid */}
          <TabsList className="grid w-full grid-cols-3">
            {" "}
            {/* Changed to 3 columns */}
            <TabsTrigger value="design">Design</TabsTrigger>{" "}
            {/* Changed value to 'design' */}
            {/* <TabsTrigger value="style">Style</TabsTrigger> */}{" "}
            {/* Removed Style Tab */}
            <TabsTrigger value="material">Material</TabsTrigger>{" "}
            {/* Added Material tab */}
            <TabsTrigger value="saved">Saved</TabsTrigger>{" "}
            {/* Changed value to 'saved' */}
          </TabsList>
        </CardContent>

        {/* Scrollable content area */}
        <div className="flex-grow overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Design Tab Content - Updated */}
            {activeTab === "design" && ( // Changed condition to 'design'
              <motion.div
                key="design-content" // Changed key
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TabsContent value="design" forceMount className="mt-0">
                  {" "}
                  {/* Changed value to 'design' */}
                  <CardContent className="space-y-4 px-2 md:px-4 pt-2 pb-4">
                    {/* Design Mode Switch */}
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">
                        {isLogoMode ? "Logo Mode" : "Design Mode"}
                      </Label>
                      <Button
                        variant="link"
                        className="text-xs p-0 h-auto"
                        onClick={toggleMode}
                      >
                        Switch to {isLogoMode ? "Design Mode" : "Logo Mode"}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    {/* AI Texture Generator Section */}
                    <div className="space-y-3 rounded-lg border bg-card p-3">
                      <Label className="flex items-center text-sm font-medium">
                        <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                        AI Texture Generator
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-6 w-6"
                        >
                          <RefreshCw className="h-3 w-3" />{" "}
                          {/* Placeholder for potential options */}
                        </Button>
                      </Label>
                      {/* Pass the ImageGenerator component provided by the parent */}
                      {imageGeneratorComponent || (
                        <p className="text-xs text-muted-foreground">
                          AI Generator not available.
                        </p>
                      )}
                      {/* Placeholder for generated previews */}
                      <div className="flex space-x-2"></div>
                      {/* Placeholder for Generating... area */}
                      <div className="h-24 bg-muted rounded border flex items-center justify-center text-sm text-muted-foreground">
                        Generating...
                      </div>
                    </div>

                    {/* Upload Custom Texture Section - Styled */}
                    <div className="space-y-3 rounded-lg border bg-card p-3">
                      <Label className="text-sm font-medium">
                        Upload Custom {isLogoMode ? "Logo" : "Texture"}
                      </Label>
                      {/* Styled Dropzone Area */}
                      <div
                        className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 text-center h-40 cursor-pointer hover:border-primary/50 transition-colors duration-200 ease-in-out bg-muted/50"
                        onClick={() =>
                          isLogoMode
                            ? logoFileInputRef.current?.click()
                            : patternFileInputRef.current?.click()
                        } // Trigger file input on click
                        // Add drag & drop handlers later if needed
                      >
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop your {isLogoMode ? "logo" : "pattern"}{" "}
                          here
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs pointer-events-none" // Prevent button click interfering with div click
                        >
                          Browse Files
                        </Button>
                      </div>
                      {/* Display active image filename/URL (optional, can be refined) */}
                      {activeImageFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Selected: {activeImageFile.name}
                        </p>
                      )}
                      {!activeImageFile && activeImageUrl && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Current:{" "}
                          {activeImageUrl.startsWith("blob:")
                            ? "Generated/Local Image"
                            : activeImageUrl.split("/").pop()}
                        </p>
                      )}
                      {/* Conditionally render TextureControls only in Logo Mode */}
                      {isLogoMode && (
                        <TextureControls
                          isLogoMode={isLogoMode} // Pass isLogoMode
                          logoTargetPart={logoTargetPart}
                          setLogoTargetPart={setLogoTargetPart}
                          logoScale={logoScale}
                          setLogoScale={setLogoScale}
                          logoOffset={logoOffset}
                          setLogoOffset={setLogoOffset}
                          offsetXMin={offsetXMin}
                          offsetXMax={offsetXMax}
                          // Props below might be redundant if TextureControls is refactored
                          // or only handles logo-specific things now. Review TextureControls component.
                          uploadedLogoTexture={activeImageTexture}
                          handleImageUpload={handleImageUpload}
                          uploadedPatternTexture={null} // Explicitly null if only for logo
                          handlePatternUpload={() => {}} // No-op if only for logo
                        />
                      )}
                      {/* Clear Button - Conditionally shown */}
                      {/* Remove Background Button - Conditionally shown in Logo Mode */}
                      {isLogoMode && activeImageTexture && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 text-xs"
                          onClick={() => {
                            // Wrap in arrow function to add log
                            console.log("Remove Background button clicked!"); // DEBUG: Log click event directly
                            handleRemoveBackground(); // Call the original handler
                          }}
                          disabled={
                            isRemovingBackground ||
                            (!activeImageFile && !activeImageUrl)
                          } // Disable if loading or no image source
                        >
                          {isRemovingBackground ? (
                            <>
                              <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            "Remove Background"
                          )}
                        </Button>
                      )}

                      {/* Display RMBG Results */}
                      {rmbgResults.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <Label className="text-xs font-medium">
                            Select Result:
                          </Label>
                          <div className="flex space-x-2 overflow-x-auto pb-2">
                            {/* Display Original Image - Make it clickable */}
                            {originalRmbgInputUrl && (
                              <img
                                src={originalRmbgInputUrl}
                                alt="Original Input"
                                title="Original Image (Click to select)"
                                className={`h-16 w-16 object-contain rounded border-2 cursor-pointer ${
                                  selectedRmbgIndex === -1 // Check if original is selected
                                    ? "border-primary"
                                    : "border-muted"
                                } hover:border-primary/70`}
                                onClick={() => {
                                  console.log("Selected Original RMBG input"); // DEBUG
                                  setSelectedRmbgIndex(-1); // Use -1 to indicate original
                                  setActiveImageUrl(originalRmbgInputUrl); // Re-apply original URL
                                  setActiveImageFile(null); // Clear any file selection
                                }}
                              />
                            )}
                            {/* Display Processed Results */}
                            {rmbgResults.map((resultUrl, index) => (
                              <img
                                key={index}
                                src={resultUrl}
                                alt={`Result ${index + 1}`}
                                className={`h-16 w-16 object-contain rounded border-2 cursor-pointer ${
                                  selectedRmbgIndex === index
                                    ? "border-primary"
                                    : "border-muted"
                                } hover:border-primary/70`}
                                onClick={() => {
                                  console.log(
                                    "Selected RMBG result URL:",
                                    resultUrl
                                  ); // DEBUG
                                  setSelectedRmbgIndex(index);
                                  setActiveImageUrl(resultUrl); // Apply selected result URL
                                  setActiveImageFile(null); // Clear any existing file, as we are using a URL now
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clear Button - Conditionally shown */}
                      {activeImageTexture && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 text-xs"
                          onClick={clearActiveImage}
                        >
                          Clear {isLogoMode ? "Logo" : "Texture"}
                        </Button>
                      )}
                    </div>

                    {/* Shirt Color Picker - Moved Here & Conditional */}
                    {isLogoMode && (
                      <div className="space-y-2 pt-2">
                        <Label className="text-sm font-medium">
                          Shirt Color
                        </Label>
                        <ColorPicker
                          availableColors={availableColors}
                          shirtColor={shirtColor}
                          setShirtColor={setShirtColor}
                        />
                      </div>
                    )}

                    {/* Size Selection - Moved Here */}
                    <div className="space-y-2 pt-2">
                      <Label className="text-sm font-medium">Size</Label>
                      <RadioGroup
                        defaultValue="M"
                        value={selectedSize}
                        onValueChange={setSelectedSize}
                        className="grid grid-cols-5 gap-2"
                      >
                        {["S", "M", "L", "XL", "2XL"].map((size) => (
                          <div key={size} className="flex items-center">
                            <RadioGroupItem
                              value={size}
                              id={`size-${size}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`size-${size}`}
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full text-center text-xs h-9"
                            >
                              {size}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </CardContent>
                </TabsContent>
              </motion.div>
            )}

            {/* Style Tab Content - REMOVED */}

            {/* Material Tab Content - Added Placeholder */}
            {activeTab === "material" && (
              <motion.div
                key="material-content"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TabsContent value="material" forceMount className="mt-0">
                  <CardContent className="px-2 md:px-4 pt-2 pb-4">
                    <p className="text-sm text-muted-foreground">
                      Material options coming soon.
                    </p>
                  </CardContent>
                </TabsContent>
              </motion.div>
            )}

            {/* Saved Designs Tab Content - Updated */}
            {activeTab === "saved" && ( // Changed condition to 'saved'
              <motion.div
                key="saved-content" // Changed key
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TabsContent value="saved" forceMount className="mt-0">
                  <CardContent className="p-2 md:p-4">
                    <MyDesignsList onDesignSelect={onDesignSelect} />
                  </CardContent>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Removed */}
      </Tabs>
    </Card>
  );
};

export default CustomizationPanel;
