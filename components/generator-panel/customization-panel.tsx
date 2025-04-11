"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import * as THREE from "three"; // Keep THREE import
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axiosInstance"; // Import the configured axios instance
import { isAxiosError } from "axios"; // Import isAxiosError separately for type checking
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence

import { Color } from "@/types";
import ColorPicker from "./color-picker";
import ModeToggle from "./mode-toggle";
import TextureControls from "./texture-controls";
import TextOptions from "./text-options";
import SaveOptions from "./save-options"; // Keep SaveOptions for the button logic
import MyDesignsList, { SavedDesign } from "./my-designs-list"; // Import the new component and type
import ImageGenerator from "../image-generator/generator"; // Import the ImageGenerator

// Shadcn UI Imports
import { Button } from "@/components/ui/button"; // Corrected to named import
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Use Textarea for description
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup

// Helper function to convert Data URL to Blob (remains the same)
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
  isGenerating: boolean; // Still needed? Maybe for SaveOptions? Keep for now.
  handleGenerate: () => void; // Still needed? Maybe for SaveOptions? Keep for now.
  handleScreenshot: () => void; // Still needed? Maybe for SaveOptions? Keep for now.
  getCanvasDataURL: () => string | null;
  resetCameraView?: () => void;
  handleReset?: () => void; // Still needed? Maybe for SaveOptions? Keep for now.
  handleShare?: () => void; // Still needed? Maybe for SaveOptions? Keep for now.
  activeTab: string; // Keep for controlling Tabs default value
  setActiveTab: (tab: string) => void; // Keep for controlling Tabs state
  onImageGenerated?: (imageUrl: string) => void; // Keep for now
  children?: React.ReactNode; // Keep for now

  // Logo/Style Props
  isLogoMode: boolean;
  logoTargetPart: "front" | "back";
  setLogoTargetPart: (part: "front" | "back") => void;
  logoScale: number;
  logoOffset: THREE.Vector2;
  uploadedLogoTexture: THREE.Texture | null;
  toggleMode: () => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearUploadedLogo: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setLogoScale: (scale: number) => void;
  setLogoOffset: (
    offset: THREE.Vector2 | ((prev: THREE.Vector2) => THREE.Vector2)
  ) => void;
  offsetXMin: number;
  offsetXMax: number;
  shirtColor: string;
  setShirtColor: (color: string) => void;

  // Simplified Pattern Props
  uploadedPatternTexture: THREE.Texture | null;
  handlePatternUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearUploadedPattern: () => void;
  patternFileInputRef: React.RefObject<HTMLInputElement | null>;
  logoFileToUpload?: File | null;
  patternFileToUpload?: File | null;
  uploadedLogoUrl?: string | null;
  uploadedPatternUrl?: string | null;
  availableColors: Color[] | null;
  onDesignSelect: (design: SavedDesign) => void; // Add onDesignSelect prop
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = (props) => {
  const {
    productId,
    sizeId,
    getCanvasDataURL,
    text,
    setText,
    isGenerating, // Keep destructuring
    handleGenerate, // Keep destructuring
    handleScreenshot, // Keep destructuring
    activeTab,
    setActiveTab,
    onImageGenerated, // Keep destructuring
    children, // Keep destructuring
    isLogoMode,
    logoTargetPart,
    setLogoTargetPart,
    logoScale,
    logoOffset,
    uploadedLogoTexture,
    toggleMode,
    handleImageUpload,
    clearUploadedLogo,
    fileInputRef,
    setLogoScale,
    setLogoOffset,
    offsetXMin,
    offsetXMax,
    shirtColor,
    setShirtColor,
    uploadedPatternTexture,
    handlePatternUpload,
    clearUploadedPattern,
    patternFileInputRef,
    logoFileToUpload,
    patternFileToUpload,
    uploadedLogoUrl: currentUploadedLogoUrl,
    uploadedPatternUrl: currentUploadedPatternUrl,
    resetCameraView,
    handleReset, // Keep destructuring
    handleShare, // Keep destructuring
    availableColors,
    onDesignSelect, // Destructure onDesignSelect
  } = props;

  const { data: session, status } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("M"); // Add state for selected size, default to M
  // Removed designDescription and designTags state

  // Animation variants for tab content
  const tabVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: 10, transition: { duration: 0.2 } },
  };

  // uploadFileToR2 function remains the same
  const uploadFileToR2 = async (
    file: File,
    designFolderId: string
  ): Promise<string | null> => {
    if (!session?.accessToken) {
      toast.error("Authentication token missing.");
      return null;
    }
    if (!designFolderId) {
      toast.error("Design folder ID is missing for upload.");
      return null;
    }
    try {
      const presignApiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/r2/generate-upload-url`;
      if (!presignApiUrl)
        throw new Error("Presign URL endpoint not configured.");

      const presignResponse = await axiosInstance.post(
        // Use axiosInstance
        presignApiUrl,
        {
          contentType: file.type,
          filename: file.name,
          folderId: designFolderId,
        },
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          withCredentials: true,
        }
      );
      const { presignedUrl, objectKey } = presignResponse.data;
      if (!presignedUrl || !objectKey)
        throw new Error("Failed to get presigned URL.");

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadResponse.ok)
        throw new Error(`R2 upload failed: ${uploadResponse.statusText}`);

      const r2PublicUrlBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BUCKET_URL;
      if (!r2PublicUrlBase)
        throw new Error("R2 public URL base not configured.");
      const baseUrl = r2PublicUrlBase.endsWith("/")
        ? r2PublicUrlBase
        : `${r2PublicUrlBase}/`;
      const finalKey = objectKey.startsWith("/")
        ? objectKey.substring(1)
        : objectKey;
      return `${baseUrl}${finalKey}`;
    } catch (error) {
      console.error("Error uploading file to R2:", error);
      toast.error(
        `Failed to upload ${file.name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return null;
    }
  };

  // handleSaveDesign function remains the same
  const handleSaveDesign = async () => {
    const designFolderId = uuidv4();
    if (status !== "authenticated") {
      toast.error("Please log in to save your design.");
      return;
    }
    if (!availableColors) {
      toast.error("Color options not loaded yet. Please wait.");
      return;
    }

    setIsSaving(true);

    const selectedColor = availableColors.find(
      (c) => c.value.trim().toLowerCase() === shirtColor.trim().toLowerCase()
    );
    if (!selectedColor) {
      toast.error("Selected color is not available for saving.");
      console.error(
        `Could not find color ID for hex: "${shirtColor}". Available colors:`,
        JSON.stringify(availableColors, null, 2)
      );
      setIsSaving(false);
      return;
    }
    const colorId = selectedColor.id;

    resetCameraView?.();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const imageDataUrl = getCanvasDataURL();
    console.log("imageDataUrl obtained:", !!imageDataUrl);

    if (!imageDataUrl) {
      toast.error("Failed to generate design preview image after reset.");
      console.error("getCanvasDataURL returned null or empty.");
      setIsSaving(false);
      return;
    }

    let finalUploadedLogoUrl: string | null = currentUploadedLogoUrl || null;
    if (logoFileToUpload) {
      console.log("Attempting to upload new logo file:", logoFileToUpload.name);
      finalUploadedLogoUrl = await uploadFileToR2(
        logoFileToUpload,
        designFolderId
      );
      if (!finalUploadedLogoUrl) {
        console.error("Logo upload failed, stopping save.");
        setIsSaving(false);
        return;
      }
      console.log("New logo uploaded. URL:", finalUploadedLogoUrl);
    } else {
      console.log(
        "No new logo file to upload, using existing URL:",
        finalUploadedLogoUrl
      );
    }

    let finalUploadedPatternUrl: string | null =
      currentUploadedPatternUrl || null;
    if (patternFileToUpload) {
      console.log(
        "Attempting to upload new pattern file:",
        patternFileToUpload.name
      );
      finalUploadedPatternUrl = await uploadFileToR2(
        patternFileToUpload,
        designFolderId
      );
      if (!finalUploadedPatternUrl) {
        console.error("Pattern upload failed, stopping save.");
        setIsSaving(false);
        return;
      }
      console.log("New pattern uploaded. URL:", finalUploadedPatternUrl);
    } else {
      console.log(
        "No new pattern file to upload, using existing URL:",
        finalUploadedPatternUrl
      );
    }

    let designImageUrl: string | null = null;
    const imageBlob = dataURLtoBlob(imageDataUrl);
    console.log("imageBlob created:", !!imageBlob);
    if (imageBlob) {
      const previewFilename = `${designFolderId}_preview.png`;
      const previewFile = new File([imageBlob], previewFilename, {
        type: "image/png",
      });
      console.log("Attempting to upload previewFile:", previewFile.name);
      designImageUrl = await uploadFileToR2(previewFile, designFolderId);
      if (!designImageUrl) {
        setIsSaving(false);
        return;
      }
      console.log("R2 Preview Upload successful. Public URL:", designImageUrl);
    } else {
      toast.error("Failed to convert preview to uploadable format.");
      setIsSaving(false);
      return;
    }

    const designData = {
      productId: productId,
      colorId: colorId,
      sizeId: sizeId,
      customText: text || null,
      designImageUrl: designImageUrl,
      shirtColorHex: shirtColor,
      isLogoMode: isLogoMode,
      logoScale: isLogoMode ? logoScale : null,
      logoOffsetX: isLogoMode ? logoOffset.x : null,
      logoOffsetY: isLogoMode ? logoOffset.y : null,
      logoTargetPart: isLogoMode ? logoTargetPart : null,
      uploadedLogoUrl: finalUploadedLogoUrl,
      uploadedPatternUrl: finalUploadedPatternUrl,
      // Removed description and tags from saved data
    };

    try {
      const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
      if (!backendApiUrl) {
        toast.error("Backend API URL is not configured.");
        setIsSaving(false);
        return;
      }
      const saveUrl = `${backendApiUrl}/designs`;
      if (!session?.accessToken) {
        toast.error("Authentication token not found. Please log in again.");
        setIsSaving(false);
        return;
      }

      console.log("Attempting to save design with data:", designData);

      await axiosInstance.post(saveUrl, designData, {
        // Use axiosInstance
        // headers: { Authorization: `Bearer ${session.accessToken}` }, // Handled by interceptor
        withCredentials: true, // Keep this if needed for CORS/cookies
      });
      toast.success("Design saved successfully!");
    } catch (error) {
      console.error("Failed to save design API call:", error);
      const errorMessage =
        isAxiosError(error) && error.response?.data?.message // Use the imported isAxiosError
          ? error.response.data.message
          : "Failed to save design. Please try again.";
      toast.error(errorMessage);
      console.error("Data attempted to save:", designData);
    } finally {
      setIsSaving(false);
    }
  };

  // Removed handleLoadDesign function

  return (
    // Use Card as the main container, add flex-col, restore h-full, remove default border/shadow/rounding
    <Card className="w-full h-full flex flex-col border-none shadow-none rounded-none bg-card text-card-foreground ">
      {/* Hidden file inputs remain */}
      <input
        type="file"
        ref={fileInputRef as React.RefObject<HTMLInputElement>}
        onChange={handleImageUpload}
        style={{ display: "none" }}
        accept="image/*"
      />
      <input
        type="file"
        ref={patternFileInputRef as React.RefObject<HTMLInputElement>}
        onChange={handlePatternUpload}
        style={{ display: "none" }}
        accept="image/*"
      />

      {/* Add responsive padding */}
      <CardHeader className="px-2 md:px-4 pt-2 pb-0 md:pt-4">
        <CardTitle className="text-xl md:text-2xl font-bold">
          MONO STUDIO
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Create your minimalist masterpiece
        </CardDescription>
      </CardHeader>

      {/* Use Shadcn Tabs */}
      {/* Add responsive padding to Tabs container if needed, or adjust CardContent padding */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex-grow flex flex-col" // Restored flex-grow, kept overflow-hidden removed for now
      >
        {/* Add responsive padding to CardContent holding the TabsList */}
        <CardContent className="pb-0 px-2 md:px-4 pt-2 md:pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Design</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="my-designs">My Designs</TabsTrigger>
          </TabsList>
        </CardContent>
        {/* Wrap TabsContent with AnimatePresence for exit animations */}
        {/* Restore flex-grow and overflow-y-auto for scrollable content */}
        {/* This div holds the scrollable tab content */}
        <div className="flex-grow overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Design Tab Content */}
            {activeTab === "text" && (
              <motion.div
                key="text-content"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TabsContent value="text" forceMount className="mt-0">
                  {/* Use forceMount with framer-motion */}
                  {/* Adjust responsive spacing for mobile */}
                  <CardContent className="space-y-1.5 md:space-y-4 px-2 md:px-4 pt-2 pb-4">
                    <TextOptions text={text} setText={setText} />
                    {/* --- Add Image Generator Here --- */}
                    <div className="space-y-1 md:space-y-2 border-t pt-3 md:pt-4">
                      <Label className="text-sm font-medium">
                        AI Texture Generator (ComfyUI)
                      </Label>
                      <ImageGenerator onImageGenerated={onImageGenerated} />
                      <p className="text-xs text-muted-foreground">
                        Enter a prompt to generate a texture using ComfyUI. The
                        generated image will be applied as a pattern.
                      </p>
                    </div>
                    {/* --- End Image Generator --- */}
                    {/* Size Selection */}
                    <div className="space-y-1 md:space-y-2">
                      <Label htmlFor="size-selection">Size</Label>
                      <RadioGroup
                        id="size-selection"
                        value={selectedSize}
                        onValueChange={setSelectedSize}
                        className="flex flex-wrap gap-2 pt-1" // Use flex-wrap for responsiveness
                      >
                        {["S", "M", "L", "XL", "2XL"].map((size) => (
                          <div
                            key={size}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem value={size} id={`size-${size}`} />
                            <Label
                              htmlFor={`size-${size}`}
                              className="cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary" // Style labels like buttons
                            >
                              {size}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    {/* Add any other design-related options here if needed */}
                  </CardContent>
                </TabsContent>
              </motion.div>
            )}

            {/* Style Tab Content */}
            {activeTab === "style" && (
              <motion.div
                key="style-content"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TabsContent value="style" forceMount className="mt-0">
                  {/* Use forceMount with framer-motion */}
                  {/* Adjust responsive spacing for mobile */}
                  <CardContent className="space-y-2 md:space-y-4 px-2 md:px-4 pt-2 pb-4">
                    {" "}
                    {/* Changed spacing */}
                    {/* Color Picker Section */}
                    <div className="space-y-1 md:space-y-2">
                      {" "}
                      {/* Keep inner spacing as is for now */}
                      <Label>Shirt Color</Label>
                      <ColorPicker
                        availableColors={availableColors}
                        shirtColor={shirtColor} // Corrected prop name
                        setShirtColor={setShirtColor} // Corrected prop name
                      />
                    </div>
                    {/* Mode Toggle Section */}
                    <div className="space-y-2">
                      <Label>Texture Mode</Label>
                      <ModeToggle
                        isLogoMode={isLogoMode}
                        toggleMode={toggleMode}
                      />
                    </div>
                    {/* Texture Controls Section */}
                    <TextureControls
                      isLogoMode={isLogoMode}
                      logoTargetPart={logoTargetPart}
                      setLogoTargetPart={setLogoTargetPart}
                      logoScale={logoScale}
                      setLogoScale={setLogoScale}
                      logoOffset={logoOffset}
                      setLogoOffset={setLogoOffset}
                      offsetXMin={offsetXMin}
                      offsetXMax={offsetXMax}
                      uploadedLogoTexture={uploadedLogoTexture}
                      uploadedPatternTexture={uploadedPatternTexture}
                      handleImageUpload={handleImageUpload} // Pass down the correct handler
                      clearUploadedLogo={clearUploadedLogo}
                      fileInputRef={fileInputRef}
                      handlePatternUpload={handlePatternUpload} // Pass down the correct handler
                      clearUploadedPattern={clearUploadedPattern}
                      patternFileInputRef={patternFileInputRef}
                    />
                  </CardContent>
                </TabsContent>
              </motion.div>
            )}

            {/* My Designs Tab Content */}
            {activeTab === "my-designs" && (
              <motion.div
                key="my-designs-content"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TabsContent value="my-designs" forceMount className="mt-0">
                  {/* Use forceMount with framer-motion */}
                  <CardContent className="p-2 md:p-4">
                    {" "}
                    {/* Added responsive padding */}
                    <MyDesignsList onDesignSelect={onDesignSelect} />
                  </CardContent>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </div>{" "}
        {/* End of scrollable content div */}
        {/* CardFooter moved inside Tabs, after the scrollable content */}
        <CardFooter className="flex-shrink-0 flex flex-col space-y-3 md:space-y-4 border-t border-border pt-3 md:pt-4 px-2 md:px-4 pb-4 md:pb-6">
          {" "}
          {/* Removed mt-auto, added flex-shrink-0 */}
          {/* Save Options */}
          <SaveOptions
            handleSaveDesign={handleSaveDesign}
            isSaving={isSaving}
            status={status}
            handleReset={handleReset} // Pass handleReset if available
          />
          {/* Add other footer content if needed */}
        </CardFooter>
      </Tabs>
    </Card>
  );
};

export default CustomizationPanel;
