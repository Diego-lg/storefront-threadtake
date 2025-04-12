"use client";
import { motion } from "framer-motion";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import axiosInstance from "@/lib/axiosInstance";
import { isAxiosError } from "axios";
import { useDesignLoaderStore } from "@/hooks/use-design-loader"; // Import the Zustand store
import axios from "axios"; // Import axios for API calls
import { Color, Size } from "@/types"; // Import Color and Size types
import toast from "react-hot-toast"; // For error notifications
import getSizes from "@/actions/get-sizes"; // Correctly import the default export
import CustomizationPanel from "./customization-panel";
import { SavedDesign } from "./my-designs-list"; // Import SavedDesign type
import ImageGenerator from "../image-generator/generator"; // Import the ImageGenerator
import * as THREE from "three";
import { useLoader } from "@react-three/fiber"; // Import TextureLoader
import { TShirtMaterials } from "../tshirt-geometry/types/tshirt-types";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"; // Import type for controls ref

import { Scene } from "../tshirt-geometry/scene";
import {
  Camera,
  RotateCcw,
  Share2,
  Menu,
  X,
  Save,
  ShoppingCart,
} from "lucide-react"; // Added Save, ShoppingCart icons
import { Button } from "@/components/ui/button"; // Import Shadcn Button (Named Import)
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Shadcn Tooltip components

interface TShirtDesignerProps {
  productId: string; // Add productId
  sizeId: string; // Add sizeId - Note: This might become redundant if selectedSize is the source of truth
}

// Define the color palette
const COLOR_PALETTE = {
  white: "#FFFFFF",
  black: "#222222",
  red: "#D32F2F",
  blue: "#1976D2",
  grey: "#757575",
};

// Helper function to convert Data URL to Blob (Moved from CustomizationPanel)
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

// Uploads a file to R2 using a presigned URL (Moved from CustomizationPanel)
const uploadFileToR2 = async (
  file: File,
  designFolderId: string,
  session: any // Pass session data or handle auth differently
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
    if (!presignApiUrl) throw new Error("Presign URL endpoint not configured.");

    const presignResponse = await axiosInstance.post(
      presignApiUrl,
      {
        contentType: file.type,
        filename: file.name,
        folderId: designFolderId,
      },
      {
        // Authorization header handled by axiosInstance interceptor
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
    if (!r2PublicUrlBase) throw new Error("R2 public URL base not configured.");
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

// Helper function to create texture load callback (Unified)
const createTextureLoadCallback = (
  newUrl: string, // Can be object URL or persistent URL
  setActiveImageTexture: React.Dispatch<
    React.SetStateAction<THREE.Texture | null>
  >,
  setActiveImageUrl: React.Dispatch<React.SetStateAction<string | null>>,
  options: { wrap?: THREE.Wrapping; flipY?: boolean } = {}
) => {
  return (texture: THREE.Texture) => {
    texture.wrapS = texture.wrapT = options.wrap ?? THREE.ClampToEdgeWrapping;
    texture.flipY = options.flipY ?? true; // Respect flipY option, default to false
    // Ensure repeat is set correctly for patterns after load
    if (options.wrap === THREE.RepeatWrapping) {
      texture.repeat.set(-1, -1); // Default repeat for patterns
    }
    texture.needsUpdate = true;
    setActiveImageTexture(texture);
    setActiveImageUrl(newUrl); // Set the URL (could be object or persistent)
    console.log("Active texture loaded:", texture, "from URL:", newUrl);
    // DEBUG: Log right after state setter is called
    console.log(`[DEBUG] setActiveImageUrl called with: ${newUrl}`);
  };
};

// Helper function for texture load error (Unified)
const createTextureLoadErrorCallback = (
  newUrl: string,
  setActiveImageUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveImageTexture: React.Dispatch<
    React.SetStateAction<THREE.Texture | null>
  >,
  setActiveImageFile: React.Dispatch<React.SetStateAction<File | null>> // Also clear file on error
) => {
  return (error: unknown) => {
    console.error(`Error loading active image from ${newUrl}:`, error);
    alert(`Failed to load image.`);
    // Only revoke if it's an object URL
    if (newUrl.startsWith("blob:")) {
      URL.revokeObjectURL(newUrl);
    }
    setActiveImageUrl(null);
    setActiveImageTexture(null);
    setActiveImageFile(null); // Clear file as well
  };
};

// Clear handler for the active image
const clearActiveImageHandler = (
  currentActiveImageUrl: string | null,
  setActiveImageUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveImageTexture: React.Dispatch<
    React.SetStateAction<THREE.Texture | null>
  >,
  setActiveImageFile: React.Dispatch<React.SetStateAction<File | null>>,
  setOriginalRmbgInputUrl: React.Dispatch<React.SetStateAction<string | null>> // Add setter for original RMBG URL
) => {
  return () => {
    // Revoke object URL if it exists
    if (currentActiveImageUrl && currentActiveImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(currentActiveImageUrl);
      console.log("Revoked object URL:", currentActiveImageUrl);
    }
    setActiveImageTexture(null);
    setActiveImageUrl(null);
    setActiveImageFile(null);
    setOriginalRmbgInputUrl(null); // Clear the original RMBG input URL

    console.log("Cleared active image state (URL, Texture, File)");
  };
};

// Unified image upload handler - Stores File locally, creates object URL
const handleImageUpload = (
  currentActiveImageUrl: string | null,
  setActiveImageUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveImageTexture: React.Dispatch<
    React.SetStateAction<THREE.Texture | null>
  >,
  setActiveImageFile: React.Dispatch<React.SetStateAction<File | null>>,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  options: { wrap?: THREE.Wrapping; flipY?: boolean } = {}
) => {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // --- Clear previous active state ---
    if (currentActiveImageUrl && currentActiveImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(currentActiveImageUrl);
    }
    setActiveImageUrl(null);
    setActiveImageTexture(null);
    setActiveImageFile(null);

    // --- Load texture locally for preview ---
    const newLocalUrl = URL.createObjectURL(file);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      newLocalUrl,
      createTextureLoadCallback(
        newLocalUrl,
        setActiveImageTexture,
        setActiveImageUrl,
        options
      ),
      undefined,
      createTextureLoadErrorCallback(
        newLocalUrl,
        setActiveImageUrl,
        setActiveImageTexture,
        setActiveImageFile // Pass file setter to error callback
      )
    );

    // --- Store the File object for later upload ---
    setActiveImageFile(file);
    console.log(`Image file stored locally for later upload: ${file.name}`);

    // Clear the file input after local processing
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
};

const TShirtDesigner: React.FC<TShirtDesignerProps> = ({
  productId,
  sizeId, // Keep original sizeId prop for now, might be needed for initial state or if cart needs it separately
}) => {
  // Destructure props
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ref for the canvas
  const controlsRef = useRef<OrbitControlsImpl>(null!); // Ref for OrbitControls, assert non-null
  const { data: session, status } = useSession(); // Get session data here

  // --- Core State ---
  const [text, setText] = useState<string>("");
  const [isGenerating] = useState<boolean>(false); // Keep for potential future use
  const [activeTab, setActiveTab] = useState<string>("design"); // Default to design tab
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // --- Unified Active Image State ---
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null); // Can be object URL or persistent URL
  const [activeImageTexture, setActiveImageTexture] =
    useState<THREE.Texture | null>(null);
  const [activeImageFile, setActiveImageFile] = useState<File | null>(null); // For pending uploads

  const [originalRmbgInputUrl, setOriginalRmbgInputUrl] = useState<
    string | null
  >(null); // State for original RMBG input

  // --- Logo Specific State (Still needed for positioning/scaling) ---
  const logoFileInputRef = useRef<HTMLInputElement>(null); // Ref for triggering logo upload
  const [isLogoMode, setIsLogoMode] = useState(false); // Determines how active image is used
  const [logoTargetPart, setLogoTargetPart] = useState<"front" | "back">(
    "front"
  );
  const [logoScale, setLogoScale] = useState(0.15);
  const [logoOffset, setLogoOffset] = useState(new THREE.Vector2(0, 0.04));

  // --- Pattern Specific State ---
  const patternFileInputRef = useRef<HTMLInputElement>(null); // Ref for triggering pattern upload

  // --- Color State ---
  const [shirtColor, setShirtColor] = useState<string>(""); // Hex value
  const [availableColors, setAvailableColors] = useState<Color[] | null>(null);

  // --- Size State (Lifted from CustomizationPanel) ---
  const [selectedSize, setSelectedSize] = useState<string>("M"); // Default to M - Holds the VALUE (e.g., "M")
  const [availableSizes, setAvailableSizes] = useState<Size[] | null>(null); // State to hold fetched sizes

  // --- Zustand State for Loading Designs ---
  const { loadDesignConfig, setLoadDesignConfig } = useDesignLoaderStore(); // Get state and setter using the hook

  // --- Saving State ---
  const [isSaving, setIsSaving] = useState(false);

  // --- Default Textures ---
  const defaultLogoTexture = useLoader(THREE.TextureLoader, "/assets/test.png");
  const defaultPatternTexture = useLoader(
    THREE.TextureLoader,
    "/assets/sample.png"
  );

  // Determine the texture to actually use in the scene
  const textureForScene =
    activeImageTexture ||
    (isLogoMode ? defaultLogoTexture : defaultPatternTexture);

  // --- Callbacks ---
  const handleScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas element not found for screenshot.");
      alert("Could not capture screenshot. Canvas not ready.");
      return;
    }
    try {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "tshirt-design.png";
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Screenshot captured and download initiated.");
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      alert("Failed to capture screenshot.");
    }
  }, [canvasRef]);

  const getCanvasDataURL = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas element not found for data URL generation.");
      return null;
    }
    try {
      const image = canvas.toDataURL("image/png");
      return image;
    } catch (error) {
      console.error("Error generating data URL:", error);
      return null;
    }
  }, [canvasRef]);

  const resetCameraView = useCallback(() => {
    const controls = controlsRef.current;
    if (controls) {
      const initialPosition = new THREE.Vector3(0, 0, 2.5);
      const initialTarget = new THREE.Vector3(0, 0, 0);
      controls.object.position.copy(initialPosition);
      controls.target.copy(initialTarget);
      controls.update();
      console.log("Camera view reset to standard state");
    } else {
      console.warn("Controls ref not available to reset view.");
    }
  }, [controlsRef]);

  const clearActiveImage = clearActiveImageHandler(
    activeImageUrl,
    setActiveImageUrl,
    setActiveImageTexture,
    setActiveImageFile,
    setOriginalRmbgInputUrl // Add the missing argument here
  );

  const onImageGenerated = useCallback(
    (imageUrl: string) => {
      console.log("AI Image generated, applying:", imageUrl);
      const textureLoader = new THREE.TextureLoader();

      // Clear previous active state first
      if (activeImageUrl && activeImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(activeImageUrl);
      }
      setActiveImageUrl(null);
      setActiveImageTexture(null);
      setActiveImageFile(null); // Generated image has no pending file

      // Determine options based on current mode (assume generated is for current mode)
      const textureOptions = isLogoMode
        ? { flipY: true, wrap: THREE.ClampToEdgeWrapping }
        : { flipY: false, wrap: THREE.RepeatWrapping };

      textureLoader.load(
        imageUrl, // The URL from the generator
        createTextureLoadCallback(
          imageUrl, // Pass the persistent URL
          setActiveImageTexture,
          setActiveImageUrl,
          textureOptions
        ),
        undefined,
        createTextureLoadErrorCallback(
          imageUrl,
          setActiveImageUrl,
          setActiveImageTexture,
          setActiveImageFile
        )
      );
      toast.success("AI image applied!");
    },
    [
      activeImageUrl,
      setActiveImageUrl,
      setActiveImageTexture,
      setActiveImageFile,
      isLogoMode,
    ]
  );

  const handleGenerate = useCallback(async () => {
    // Placeholder - Actual generation logic might be more complex
    // This assumes the ImageGenerator component handles the actual API call
    // and calls onImageGenerated upon success.
    console.log("Generate button clicked (handled by ImageGenerator)");
  }, []);

  const { offsetXMin, offsetXMax } = useMemo(() => {
    const maxOffset = (1 - logoScale) / 2;
    return { offsetXMin: -maxOffset, offsetXMax: maxOffset };
  }, [logoScale]);

  const handleReset = useCallback(() => {
    setText("");
    setShirtColor(COLOR_PALETTE.white); // Reset to default color
    setIsLogoMode(false); // Default to pattern mode
    clearActiveImage(); // Use the unified clear handler
    setLogoScale(0.15);
    setLogoOffset(new THREE.Vector2(0, 0.04));
    setLogoTargetPart("front");
    // resetCameraView(); // Optional: Reset camera view as well
    toast.success("Design reset to defaults.");
  }, [
    clearActiveImage,
    setText,
    setShirtColor,
    setIsLogoMode,
    setLogoScale,
    setLogoOffset,
    setLogoTargetPart,
  ]);

  const handleDesignSelect = useCallback(
    (design: SavedDesign) => {
      console.log("Design selected in TShirtPanel:", design);
      useDesignLoaderStore.setState({ loadDesignConfig: design });
      setActiveTab("design"); // Switch to design tab to see changes
      toast.success(`Loading design: ${design.designName || "Saved Design"}`);
    },
    [setActiveTab]
  );

  const toggleMode = useCallback(() => {
    setIsLogoMode((prev) => !prev);
  }, []);

  // Saves the current design configuration (Moved from CustomizationPanel)
  const handleSaveDesign = useCallback(async () => {
    const designFolderId = uuidv4();
    if (status !== "authenticated") {
      toast.error("Please log in to save your design.");
      return;
    }
    // Ensure colors and sizes are loaded
    // Note: We check availableSizes is not null, but allow it to be empty if the product truly has no sizes (unlikely)
    // The check for the *selected* size happens later.
    if (!availableColors || availableSizes === null) {
      toast.error("Color or size options not loaded yet. Please wait.");
      console.error("Save prerequisites not met:", {
        availableColors,
        availableSizes,
      });
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

    // --- Find the correct Size ID for the *selected* size ---
    const selectedSizeObject = availableSizes?.find(
      // Use optional chaining as availableSizes could be []
      (s) => s.value === selectedSize // Find size by matching the VALUE state
    );

    if (!selectedSizeObject) {
      toast.error(
        `Selected size "${selectedSize}" could not be found in available options. Cannot save.`
      );
      console.error(
        `Could not find size object for value: "${selectedSize}". Available sizes:`,
        JSON.stringify(availableSizes, null, 2)
      );
      setIsSaving(false);
      return;
    }
    const actualSizeId = selectedSizeObject.id; // Get the ID from the found object
    // --- End Size ID logic ---
    // Reset camera and wait briefly for view update before screenshot
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

    // --- Upload Active Image if necessary ---
    let finalActiveUrl: string | null = null;
    if (activeImageFile) {
      console.log(
        `Attempting to upload new active image file (${
          isLogoMode ? "logo" : "pattern"
        }):`,
        activeImageFile.name
      );
      finalActiveUrl = await uploadFileToR2(
        activeImageFile,
        designFolderId,
        session
      );
      if (!finalActiveUrl) {
        console.error("Active image upload failed, stopping save.");
        toast.error("Failed to upload custom texture.");
        setIsSaving(false);
        return;
      }
      console.log("New active image uploaded. URL:", finalActiveUrl);
    } else {
      finalActiveUrl = activeImageUrl;
      console.log(
        "No new active image file to upload, using existing URL:",
        finalActiveUrl
      );
    }

    const finalUploadedLogoUrl = isLogoMode ? finalActiveUrl : null;
    const finalUploadedPatternUrl = !isLogoMode ? finalActiveUrl : null;

    console.log("Final Logo URL for save:", finalUploadedLogoUrl);
    console.log("Final Pattern URL for save:", finalUploadedPatternUrl);

    // --- Upload Preview Image ---
    let designImageUrl: string | null = null;
    const imageBlob = dataURLtoBlob(imageDataUrl);
    console.log("imageBlob created:", !!imageBlob);
    if (imageBlob) {
      const previewFilename = `${designFolderId}_preview.png`;
      const previewFile = new File([imageBlob], previewFilename, {
        type: "image/png",
      });
      console.log("Attempting to upload previewFile:", previewFile.name);
      designImageUrl = await uploadFileToR2(
        previewFile,
        designFolderId,
        session
      );
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

    // --- Construct single design data payload ---
    const designData = {
      productId: productId,
      colorId: colorId,
      sizeId: actualSizeId, // Use the ID of the currently selected size
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
      // Add other fields if they exist in your model (description, tags, etc.)
      // description: "My awesome design", // Example
      // tags: ["cool", "tshirt"], // Example
    };

    // --- Send single save request ---
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

      console.log("Attempting to save single design with data:", designData);

      await axiosInstance.post(saveUrl, designData, {
        withCredentials: true,
      });

      toast.success("Design saved successfully!");
    } catch (error) {
      console.error("Failed to save design API call:", error);
      const errorMessage =
        isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Failed to save design. Please try again.";
      toast.error(errorMessage);
      console.error("Data attempted to save:", designData);
    } finally {
      setIsSaving(false);
    }
  }, [
    status,
    session,
    availableColors,
    availableSizes, // Add availableSizes to dependency array
    shirtColor,
    resetCameraView,
    getCanvasDataURL,
    activeImageFile,
    isLogoMode,
    activeImageUrl,
    productId,
    selectedSize, // Keep selectedSize value as dependency
    text,
    logoScale,
    logoOffset,
    logoTargetPart,
  ]);

  // Placeholder handler for Share button
  const handleShare = useCallback(() => {
    // TODO: Implement actual share logic (e.g., copy link, open share modal)
    toast("Share feature coming soon!");
    console.log("Share button clicked");
  }, []);

  // Placeholder handler for Add to Cart button
  const handleAddToCart = useCallback(() => {
    // TODO: Implement actual add to cart logic (e.g., call API, update cart state)
    toast.success(
      `Added design with size ${selectedSize} to cart! (Placeholder)`
    );
    console.log("Add to Cart clicked", {
      productId,
      selectedSize,
      shirtColor,
      activeImageUrl /* ... other relevant state */,
    });
  }, [productId, selectedSize, shirtColor, activeImageUrl]);

  // --- Effects ---
  useEffect(() => {
    if (defaultLogoTexture) {
      defaultLogoTexture.wrapS = defaultLogoTexture.wrapT =
        THREE.ClampToEdgeWrapping;
      defaultLogoTexture.flipY = true;
      defaultLogoTexture.needsUpdate = true;
    }
  }, [defaultLogoTexture]);

  useEffect(() => {
    if (defaultPatternTexture) {
      defaultPatternTexture.wrapS = defaultPatternTexture.wrapT =
        THREE.RepeatWrapping;
      defaultPatternTexture.flipY = false;
      defaultPatternTexture.repeat.set(-1, -1);
      defaultPatternTexture.needsUpdate = true;
    }
  }, [defaultPatternTexture]);

  useEffect(() => {
    const url = activeImageUrl; // Capture current URL
    return () => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
        console.log("Revoked active object URL:", url);
      }
    };
  }, [activeImageUrl]);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.error("NEXT_PUBLIC_API_URL is not defined.");
          toast.error("Could not load color options (API URL missing).");
          return;
        }
        const colorsUrl = `${apiUrl}/colors`;
        console.log("Fetching colors from:", colorsUrl);
        const response = await axios.get<Color[]>(colorsUrl);
        setAvailableColors(response.data);
        console.log("Available colors fetched:", response.data);
      } catch (error) {
        console.error("Failed to fetch colors:", error);
        toast.error("Failed to load color options.");
      }
    };
    fetchColors();
  }, [productId]); // Dependency array for fetching colors

  // --- Fetch Available Sizes ---
  useEffect(() => {
    const fetchSizes = async () => {
      try {
        console.log("Fetching available sizes...");
        const sizes = await getSizes(); // Use the imported action
        setAvailableSizes(sizes);
        console.log("Available sizes fetched:", sizes);
        // Optional: Set default selectedSize based on fetched sizes if needed
        // if (sizes && sizes.length > 0 && !sizes.find(s => s.value === selectedSize)) {
        //   setSelectedSize(sizes[0].value); // Set to first available size value if default 'M' isn't valid
        // }
      } catch (error) {
        console.error("Failed to fetch sizes:", error);
        toast.error("Could not load size options.");
        setAvailableSizes([]); // Set to empty array on error to prevent blocking save
      }
    };
    fetchSizes();
  }, []);

  useEffect(() => {
    if (loadDesignConfig && availableColors) {
      console.log("Loading design config from store:", loadDesignConfig);
      setText(loadDesignConfig.customText || "");
      setShirtColor(loadDesignConfig.shirtColorHex || COLOR_PALETTE.white);
      const mode = loadDesignConfig.isLogoMode ?? false;
      setIsLogoMode(mode);
      if (mode) {
        setLogoScale(loadDesignConfig.logoScale ?? 0.15);
        setLogoOffset(
          new THREE.Vector2(
            loadDesignConfig.logoOffsetX ?? 0,
            loadDesignConfig.logoOffsetY ?? 0.04
          )
        );
        const targetPart =
          loadDesignConfig.logoTargetPart === "back" ? "back" : "front";
        setLogoTargetPart(targetPart);
      } else {
        setLogoScale(0.15);
        setLogoOffset(new THREE.Vector2(0, 0.04));
        setLogoTargetPart("front");
      }
      const textureLoader = new THREE.TextureLoader();
      const urlToLoad = mode
        ? loadDesignConfig.uploadedLogoUrl
        : loadDesignConfig.uploadedPatternUrl;
      const textureOptions = mode
        ? { flipY: true, wrap: THREE.ClampToEdgeWrapping }
        : { flipY: false, wrap: THREE.RepeatWrapping };
      if (activeImageUrl && activeImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(activeImageUrl);
      }
      setActiveImageUrl(null);
      setActiveImageTexture(null);
      setActiveImageFile(null);
      if (urlToLoad) {
        console.log(
          `Loading active texture (${mode ? "logo" : "pattern"}) from URL:`,
          urlToLoad
        );
        textureLoader.load(
          urlToLoad,
          createTextureLoadCallback(
            urlToLoad,
            setActiveImageTexture,
            setActiveImageUrl,
            textureOptions
          ),
          undefined,
          createTextureLoadErrorCallback(
            urlToLoad,
            setActiveImageUrl,
            setActiveImageTexture,
            setActiveImageFile
          )
        );
      } else {
        console.log(
          `No ${mode ? "logo" : "pattern"} URL found in saved design.`
        );
      }
      setLoadDesignConfig(null);
      console.log("Cleared loadDesignConfig from store.");
    } else if (!loadDesignConfig && availableColors && !shirtColor) {
      const defaultColor =
        availableColors.find((c) => c.name.toLowerCase() === "white") ||
        availableColors[0];
      if (defaultColor) {
        setShirtColor(defaultColor.value);
        console.log("Set default shirt color:", defaultColor.value);
      }
    }
  }, [
    loadDesignConfig,
    availableColors,
    setLoadDesignConfig,
    activeImageUrl,
    shirtColor,
  ]);
  // Effect to load texture when activeImageUrl changes (and it's not from a file upload or already loaded)
  useEffect(() => {
    // Only proceed if:
    // 1. There's an activeImageUrl.
    // 2. There's no pending activeImageFile (meaning it's not a direct file upload).
    // 3. The current texture's source URL doesn't already match the activeImageUrl (prevent reload loops).
    if (
      activeImageUrl &&
      !activeImageFile &&
      activeImageTexture?.source?.data?.src !== activeImageUrl // Check texture source URL
    ) {
      console.log(
        `[Effect Triggered] activeImageUrl changed to non-file source: ${activeImageUrl.substring(
          0,
          60 // Log only the start of potentially long data URLs
        )}... Attempting to load texture.`
      );

      const textureLoader = new THREE.TextureLoader();
      // Determine options based on current mode (logo vs pattern)
      const textureOptions = isLogoMode
        ? { flipY: true, wrap: THREE.ClampToEdgeWrapping } // Logo options
        : { flipY: false, wrap: THREE.RepeatWrapping }; // Pattern options

      // --- Texture Loading ---
      textureLoader.load(
        activeImageUrl, // Load directly from the URL (could be data:, blob:, http:)
        // Success Callback
        createTextureLoadCallback(
          activeImageUrl, // Pass the URL that was loaded
          setActiveImageTexture,
          setActiveImageUrl, // Re-set the URL just in case (though it shouldn't change here)
          textureOptions
        ),
        // Progress Callback (optional)
        undefined,
        // Error Callback
        createTextureLoadErrorCallback(
          activeImageUrl,
          setActiveImageUrl,
          setActiveImageTexture,
          setActiveImageFile // Pass file setter to error callback
        )
      );
    }

    // Dependencies: This effect should run if the URL changes, the file status changes,
    // the mode changes (affecting texture options), or the texture itself changes (to check its source).
  }, [
    activeImageUrl,
    activeImageFile,
    isLogoMode,
    activeImageTexture, // Include texture to check its source URL
    setActiveImageTexture,
    setActiveImageUrl,
    setActiveImageFile,
  ]);

  useEffect(() => {
    const currentTexture = activeImageTexture;
    if (activeImageUrl && activeImageUrl !== currentTexture?.image?.src) {
      console.log(
        `useEffect[activeImageUrl]: Loading texture from URL: ${activeImageUrl}`
      );
      const textureLoader = new THREE.TextureLoader();
      const textureOptions = isLogoMode
        ? { flipY: true, wrap: THREE.ClampToEdgeWrapping }
        : { flipY: false, wrap: THREE.RepeatWrapping };
      if (!activeImageUrl.startsWith("blob:")) {
        setActiveImageFile(null);
      }
      textureLoader.load(
        activeImageUrl,
        createTextureLoadCallback(
          activeImageUrl,
          setActiveImageTexture,
          setActiveImageUrl,
          textureOptions
        ),
        undefined,
        (error) => {
          console.error(
            `Error loading active image from ${activeImageUrl} in useEffect:`,
            error
          );
          toast.error(
            `Failed to load image: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          setActiveImageTexture(null);
          setActiveImageFile(null);
        }
      );
    } else if (!activeImageUrl && currentTexture) {
      console.log(
        "useEffect[activeImageUrl]: Clearing texture state as URL is null."
      );
      setActiveImageTexture(null);
      setActiveImageFile(null);
    }
    return () => {
      if (currentTexture && currentTexture !== activeImageTexture) {
        console.log(
          "useEffect[activeImageUrl]: Disposing previous texture.",
          currentTexture
        );
        currentTexture.dispose();
      }
    };
  }, [
    activeImageUrl,
    isLogoMode,
    setActiveImageTexture,
    setActiveImageUrl,
    setActiveImageFile,
  ]);

  const materials = useMemo<TShirtMaterials>(() => {
    const baseMaterialProps = {
      roughness: 0.8,
      metalness: 0.7,
      side: THREE.DoubleSide,
      color: parseInt(shirtColor.replace("#", "0x")),
    };
    let patternMapFront: THREE.Texture | null = null;
    let patternMapBack: THREE.Texture | null = null;
    if (!isLogoMode && textureForScene) {
      patternMapFront = textureForScene.clone();
      if (patternMapFront) {
        patternMapFront.needsUpdate = true;
        patternMapFront.wrapS = THREE.RepeatWrapping;
        patternMapFront.wrapT = THREE.RepeatWrapping;
        patternMapFront.repeat.set(1, 1);
      }
      patternMapBack = textureForScene.clone();
      if (patternMapBack) {
        patternMapBack.needsUpdate = true;
        patternMapBack.wrapS = THREE.RepeatWrapping;
        patternMapBack.wrapT = THREE.RepeatWrapping;
        patternMapBack.repeat.set(-1, 1);
      }
    }
    return {
      rightSleeve: { ...baseMaterialProps, map: patternMapFront },
      leftSleeve: { ...baseMaterialProps, map: patternMapFront },
      front: { ...baseMaterialProps, map: patternMapFront },
      back: { ...baseMaterialProps, map: patternMapBack },
      collar: { ...baseMaterialProps, map: null },
    };
  }, [shirtColor, textureForScene, isLogoMode]);

  // --- Render ---
  return (
    <>
      {" "}
      {/* Root Fragment */}
      {/* Main container for the two panels */}
      <div className="flex flex-col md:flex-row max-h-full bg-background text-foreground">
        {" "}
        {/* Removed h-[94vh] */}
        {/* 3D View Panel */}
        <TooltipProvider>
          <div className="w-full md:w-[60%] lg:w-[65%] h-[50vh] md:h-[90vh] relative">
            {" "}
            <Scene
              canvasRef={canvasRef}
              materials={materials}
              shirtColor={shirtColor}
              logoTexture={textureForScene}
              isLogoMode={isLogoMode}
              logoTargetPart={logoTargetPart}
              logoScale={logoScale}
              logoOffset={logoOffset}
              controlsRef={controlsRef}
            />
          </div>
        </TooltipProvider>
        {/* Customization Panel */}
        {/* Removed fixed height and overflow for mobile */}
        <div className="w-full md:w-[40%] lg:w-[35%] md:h-full bg-card text-card-foreground flex flex-col relative border-t md:border-t-0 md:border-l border-border">
          <CustomizationPanel
            productId={productId}
            imageGeneratorComponent={
              <ImageGenerator onImageGenerated={onImageGenerated} />
            }
            sizeId={sizeId} // Pass original sizeId if needed
            text={text}
            setText={setText}
            isGenerating={isGenerating}
            handleGenerate={handleGenerate}
            handleScreenshot={handleScreenshot} // Pass down if needed by CustomizationPanel
            getCanvasDataURL={getCanvasDataURL} // Pass down if needed by CustomizationPanel
            resetCameraView={resetCameraView} // Pass down if needed by CustomizationPanel
            handleReset={handleReset} // Pass down if needed by CustomizationPanel
            handleShare={handleShare} // Pass down if needed by CustomizationPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            // --- Unified Image Props ---
            activeImageTexture={activeImageTexture}
            activeImageUrl={activeImageUrl}
            activeImageFile={activeImageFile}
            clearActiveImage={clearActiveImage}
            setActiveImageFile={setActiveImageFile}
            setActiveImageUrl={setActiveImageUrl}
            // --- Mode & Logo Specific Props ---
            isLogoMode={isLogoMode}
            toggleMode={toggleMode}
            logoTargetPart={logoTargetPart}
            setLogoTargetPart={setLogoTargetPart}
            logoScale={logoScale}
            setLogoScale={setLogoScale}
            logoOffset={logoOffset}
            setLogoOffset={setLogoOffset}
            offsetXMin={offsetXMin}
            offsetXMax={offsetXMax}
            // --- Refs for triggering uploads ---
            logoFileInputRef={logoFileInputRef}
            patternFileInputRef={patternFileInputRef}
            // --- Color Props ---
            shirtColor={shirtColor}
            setShirtColor={setShirtColor}
            availableColors={availableColors}
            // --- Design Loading ---
            onDesignSelect={handleDesignSelect}
            // --- Size State Props ---
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            // --- RMBG Original Input State ---
            originalRmbgInputUrl={originalRmbgInputUrl} // Pass state down
            setOriginalRmbgInputUrl={setOriginalRmbgInputUrl} // Pass setter down
          />
        </div>
      </div>
      {/* Bottom Controls: Save/Share/Export & Price/Cart (Moved Outside Main Flex Container) */}
      <div className="p-4 bg-background border-t border-border">
        {" "}
        {/* Removed absolute positioning */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDesign}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />{" "}
              {isSaving ? "Saving..." : "Save Design"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleScreenshot}>
              <Camera className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: Just now {/* Placeholder */}
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm font-medium">Price Estimate</p>
            <p className="text-xs text-muted-foreground">
              Based on your current selections
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold">$149.99</p>{" "}
            {/* Placeholder Price */}
            <p className="text-xs text-muted-foreground">Free shipping</p>
          </div>
        </div>
        <Button className="w-full mt-3" size="lg" onClick={handleAddToCart}>
          <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
        </Button>
      </div>
    </>
  );
};

export default TShirtDesigner;
