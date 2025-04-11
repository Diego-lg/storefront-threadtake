"use client";
import { motion } from "framer-motion";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  // Dispatch, // Removed unused
  // SetStateAction, // Removed unused
} from "react";
import { useDesignLoaderStore } from "@/hooks/use-design-loader"; // Import the Zustand store
import axios from "axios"; // Import axios for API calls
import { Color } from "@/types"; // Import Color type
import toast from "react-hot-toast"; // For error notifications
import CustomizationPanel from "./customization-panel";
import { SavedDesign } from "./my-designs-list"; // Import SavedDesign type
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { TShirtMaterials } from "../tshirt-geometry/types/tshirt-types";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"; // Import type for controls ref

import { Scene } from "../tshirt-geometry/scene";
import { Camera, RotateCcw, Share2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button"; // Import Shadcn Button (Named Import)
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Shadcn Tooltip components

interface TShirtDesignerProps {
  productId: string; // Add productId
  sizeId: string; // Add sizeId
}

// Define the color palette
const COLOR_PALETTE = {
  white: "#FFFFFF",
  black: "#222222",
  red: "#D32F2F",
  blue: "#1976D2",
  grey: "#757575",
};

// Helper function to create texture load callback
const createTextureLoadCallback = (
  newUrl: string,
  setUploadedTexture: React.Dispatch<
    React.SetStateAction<THREE.Texture | null>
  >,
  setUploadedUrl: React.Dispatch<React.SetStateAction<string | null>>,
  options: { wrap?: THREE.Wrapping; flipY?: boolean } = {}
) => {
  return (texture: THREE.Texture) => {
    texture.wrapS = texture.wrapT = options.wrap ?? THREE.ClampToEdgeWrapping;
    texture.flipY = options.flipY ?? false;
    // Ensure repeat is set correctly for patterns after load
    if (options.wrap === THREE.RepeatWrapping) {
      texture.repeat.set(1, 1); // Default repeat for patterns
    }
    texture.needsUpdate = true;
    setUploadedTexture(texture);
    console.log("User texture loaded:", texture);
  };
};

// Helper function for texture load error
const createTextureLoadErrorCallback = (
  newUrl: string,
  setUploadedUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setUploadedTexture: React.Dispatch<
    React.SetStateAction<THREE.Texture | null>
  >,
  partName: string
) => {
  return (error: unknown) => {
    console.error(`Error loading user ${partName}:`, error);
    alert(`Failed to load ${partName}.`);
    URL.revokeObjectURL(newUrl);
    setUploadedUrl(null);
    setUploadedTexture(null);
  };
};

// Generic clear handler creator - Clears local URL, texture, and stored File
const createClearHandler = (
  currentLocalUrl: string | null,
  setLocalUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setTexture: React.Dispatch<React.SetStateAction<THREE.Texture | null>>,
  setFileToUpload?: React.Dispatch<React.SetStateAction<File | null>> // Optional File setter
) => {
  // Removed useCallback wrapper
  return () => {
    // Return the inner function directly
    if (currentLocalUrl) {
      URL.revokeObjectURL(currentLocalUrl);
    }
    setTexture(null);
    setLocalUrl(null); // Ensure local URL is also cleared
    setFileToUpload?.(null); // Clear the stored File object
    console.log("Cleared uploaded texture, local URL, and stored File");
  }; // Close inner function
}; // Close outer function

// Generic image upload handler creator - Stores File locally, NO R2 UPLOAD HERE
const createUploadHandler = (
  currentLocalUrl: string | null, // Renamed for clarity
  setLocalUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setTexture: React.Dispatch<React.SetStateAction<THREE.Texture | null>>,
  setFileToUpload: React.Dispatch<React.SetStateAction<File | null>>, // State setter for the File object
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  partName: string,
  // session: ReturnType<typeof useSession>["data"], // Session no longer needed here
  options: { wrap?: THREE.Wrapping; flipY?: boolean } = {}
) => {
  // Removed useCallback wrapper
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Return the inner async function directly
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // --- Clear previous state ---
    if (currentLocalUrl) {
      URL.revokeObjectURL(currentLocalUrl);
    }
    setLocalUrl(null); // Clear local URL immediately
    setTexture(null); // Clear texture
    setFileToUpload(null); // Clear previous File object

    // --- Load texture locally for preview ---
    const newLocalUrl = URL.createObjectURL(file);
    setLocalUrl(newLocalUrl); // Set new local URL for texture loading
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      newLocalUrl,
      createTextureLoadCallback(
        newLocalUrl,
        setTexture,
        setLocalUrl, // Pass setLocalUrl here
        options
      ),
      undefined,
      // Pass setLocalUrl to error callback too
      createTextureLoadErrorCallback(
        newLocalUrl,
        setLocalUrl,
        setTexture,
        partName
      )
    );

    // --- Store the File object for later upload ---
    setFileToUpload(file);
    console.log(`${partName} file stored locally for later upload.`);
    // --- R2 Upload Removed ---

    // Clear the file input after local processing
    if (fileInputRef.current) fileInputRef.current.value = "";
  }; // Close inner async function
}; // Close outer function

const TShirtDesigner: React.FC<TShirtDesignerProps> = ({
  productId,
  sizeId,
}) => {
  // Destructure props
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ref for the canvas
  const controlsRef = useRef<OrbitControlsImpl>(null!); // Ref for OrbitControls, assert non-null

  // Screenshot handler implementation
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
      document.body.appendChild(link); // Required for Firefox
      link.click();
      document.body.removeChild(link);
      console.log("Screenshot captured and download initiated.");
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      alert("Failed to capture screenshot.");
    }
  }, [canvasRef]); // Dependency on the ref

  // Function to get canvas data URL for saving
  const getCanvasDataURL = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas element not found for data URL generation.");
      return null;
    }
    try {
      // Consider adding quality parameter if needed: canvas.toDataURL("image/jpeg", 0.9);
      const image = canvas.toDataURL("image/png");
      return image;
    } catch (error) {
      console.error("Error generating data URL:", error);
      return null;
    }
  }, [canvasRef]);

  // Function to reset camera view to the standard interactive state
  const resetCameraView = useCallback(() => {
    const controls = controlsRef.current;
    if (controls) {
      // Manually set camera position and target to the initial state
      const initialPosition = new THREE.Vector3(0, 0, 2.5); // Standard position
      const initialTarget = new THREE.Vector3(0, 0, 0); // Standard target

      controls.object.position.copy(initialPosition);
      controls.target.copy(initialTarget);
      controls.update(); // Ensure controls update internal state

      console.log("Camera view reset to standard state");
    } else {
      console.warn("Controls ref not available to reset view.");
    }
  }, [controlsRef]); // Dependency on the ref

  // Function to manually set camera position and target

  const [text, setText] = useState<string>("");
  const [isGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("text"); // Start on Design tab
  // const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false); // Removed unused state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // const [fullImageUrl, setFullImageUrl] = useState<string | null>(null); // Removed unused state

  // --- Logo State ---
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isLogoMode, setIsLogoMode] = useState(false);
  const [logoTargetPart, setLogoTargetPart] = useState<"front" | "back">(
    "front"
  );
  const [logoScale, setLogoScale] = useState(0.15);
  const [logoOffset, setLogoOffset] = useState(new THREE.Vector2(0, 0.04));
  const [uploadedLogoTexture, setUploadedLogoTexture] =
    useState<THREE.Texture | null>(null);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null); // Local object URL for preview texture
  // Add state for the File object itself
  const [logoFileToUpload, setLogoFileToUpload] = useState<File | null>(null);
  // --- End Logo State ---

  // --- Simplified Pattern State ---
  const patternFileInputRef = useRef<HTMLInputElement>(null); // Single ref for pattern
  const [uploadedPatternTexture, setUploadedPatternTexture] =
    useState<THREE.Texture | null>(null);
  const [uploadedPatternUrl, setUploadedPatternUrl] = useState<string | null>(
    null
  ); // Local object URL
  // Add state for the File object itself
  const [patternFileToUpload, setPatternFileToUpload] = useState<File | null>(
    null
  );
  // Removed per-part state
  // --- End Pattern State ---

  // --- Color State ---
  // Initialize without default, will be set by effect
  const [shirtColor, setShirtColor] = useState<string>(""); // Hex value
  const [availableColors, setAvailableColors] = useState<Color[] | null>(null); // State for fetched colors
  // --- End Color State ---

  // Load default textures
  const defaultLogoTexture = useLoader(THREE.TextureLoader, "/assets/test.png");
  const defaultPatternTexture = useLoader(
    THREE.TextureLoader,
    "/assets/sample.png"
  ); // Only one default pattern

  // Determine active textures
  const currentLogoTexture = uploadedLogoTexture || defaultLogoTexture;
  const currentPatternTexture = uploadedPatternTexture || defaultPatternTexture;

  // Configure default logo texture properties
  useEffect(() => {
    if (defaultLogoTexture) {
      defaultLogoTexture.wrapS = defaultLogoTexture.wrapT =
        THREE.ClampToEdgeWrapping;
      defaultLogoTexture.flipY = true; // Keep logo flipped
      defaultLogoTexture.needsUpdate = true;
    }
  }, [defaultLogoTexture]);

  // Configure default pattern texture properties
  useEffect(() => {
    if (defaultPatternTexture) {
      defaultPatternTexture.wrapS = defaultPatternTexture.wrapT =
        THREE.RepeatWrapping;
      defaultPatternTexture.flipY = false; // Pattern not flipped
      defaultPatternTexture.repeat.set(1, 1); // Ensure repeat is 1,1 initially
      defaultPatternTexture.needsUpdate = true;
    }
  }, [defaultPatternTexture]);

  // Cleanup effects for object URLs
  useEffect(() => {
    return () => {
      if (uploadedLogoUrl) URL.revokeObjectURL(uploadedLogoUrl);
    };
  }, [uploadedLogoUrl]);
  useEffect(() => {
    return () => {
      if (uploadedPatternUrl) URL.revokeObjectURL(uploadedPatternUrl);
    };
  }, [uploadedPatternUrl]);
  // Removed cleanup for other pattern URLs

  // Effect to fetch available colors on mount
  useEffect(() => {
    const fetchColors = async () => {
      try {
        // Use NEXT_PUBLIC_API_URL which should point to the storefront's API route proxying to the backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.error("NEXT_PUBLIC_API_URL is not defined.");
          toast.error("Could not load color options (API URL missing).");
          return;
        }
        // Construct the URL correctly. Assuming NEXT_PUBLIC_API_URL includes the base path.
        // The actual path depends on how the storefront API routes are set up.
        // Let's assume a path like `/api/colors` exists in the storefront to fetch colors.
        // This might need adjustment based on actual API structure.
        const colorsUrl = `${apiUrl}/colors`; // Adjust if needed
        console.log("Fetching colors from:", colorsUrl);
        const response = await axios.get<Color[]>(colorsUrl);
        setAvailableColors(response.data);
        console.log("Available colors fetched:", response.data);
      } catch (error) {
        console.error("Failed to fetch colors:", error);
        toast.error("Failed to load color options.");
        // Set default palette as fallback? Or handle error state?
        // setAvailableColors(Object.entries(COLOR_PALETTE).map(([name, value], i) => ({ id: `fallback-${i}`, name, value })));
      }
    };

    fetchColors();
  }, []); // Empty dependency array ensures this runs only once on mount
  // Effect to load design config from Zustand store on mount or when availableColors changes
  useEffect(() => {
    const { loadDesignConfig, setLoadDesignConfig } =
      useDesignLoaderStore.getState();

    // Only proceed if we have a config to load AND availableColors are loaded (needed for color mapping)
    if (loadDesignConfig && availableColors) {
      console.log("Loading full design config from store:", loadDesignConfig);
      console.log(
        "Applying saved design logo. URL:",
        loadDesignConfig.uploadedLogoUrl
      );

      // --- Apply Base Config ---
      setText(loadDesignConfig.customText || "");

      // Use the saved shirtColorHex directly if available, otherwise fallback
      setShirtColor(loadDesignConfig.shirtColorHex || COLOR_PALETTE.white);

      // Set mode based on saved value, default to pattern mode if null/undefined
      const mode = loadDesignConfig.isLogoMode ?? false;
      setIsLogoMode(mode);
      console.log("isLogoMode from loaded design:", mode);

      // --- Apply Logo Config (if applicable) ---
      if (mode) {
        setLogoScale(loadDesignConfig.logoScale ?? 0.15); // Use saved scale or default
        setLogoOffset(
          new THREE.Vector2(
            loadDesignConfig.logoOffsetX ?? 0,
            loadDesignConfig.logoOffsetY ?? 0.04
          )
        ); // Use saved offset or default
        // Ensure the loaded value is one of the allowed types
        const targetPart =
          loadDesignConfig.logoTargetPart === "back" ? "back" : "front";
        setLogoTargetPart(targetPart); // Use saved target or default
        console.log(
          "Applying logo properties: scale=",
          loadDesignConfig.logoScale ?? 0.15,
          "offsetX=",
          loadDesignConfig.logoOffsetX ?? 0,
          "offsetY=",
          loadDesignConfig.logoOffsetY ?? 0.04,
          "target=",
          targetPart
        );
      } else {
        // Reset logo settings if loading into pattern mode
        setLogoScale(0.15);
        setLogoOffset(new THREE.Vector2(0, 0.04));
        setLogoTargetPart("front");
      }

      // --- Load Textures from URLs ---
      const textureLoader = new THREE.TextureLoader();

      // Clear any pending file uploads first
      setLogoFileToUpload(null);
      setPatternFileToUpload(null);

      // Load Logo Texture if URL exists
      if (loadDesignConfig.uploadedLogoUrl) {
        console.log(
          "Loading logo texture from URL:",
          loadDesignConfig.uploadedLogoUrl
        );
        console.log(
          "Attempting to set logo texture with URL:",
          loadDesignConfig.uploadedLogoUrl
        );
        textureLoader.load(
          loadDesignConfig.uploadedLogoUrl,
          (texture) => {
            // Success callback
            console.log(
              "Logo texture loaded successfully:",
              loadDesignConfig.uploadedLogoUrl
            ); // Added specific log
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.flipY = true;
            texture.needsUpdate = true;
            setUploadedLogoTexture(texture);
            setUploadedLogoUrl(loadDesignConfig.uploadedLogoUrl!); // Set the URL state
            console.log("Updating logo texture state after successful load."); // Added specific log
            console.log("Saved logo texture loaded successfully."); // Kept original log
          },
          undefined, // Progress callback (optional)
          (error) => {
            // Error callback
            console.error(
              "Failed to load logo texture:",
              loadDesignConfig.uploadedLogoUrl,
              error
            ); // Added specific log
            console.error("Error loading saved logo texture:", error); // Kept original log
            toast.error("Failed to load saved logo image.");
            setUploadedLogoTexture(null); // Clear texture on error
            setUploadedLogoUrl(null); // Clear URL on error
          }
        );
      } else {
        // If no saved logo URL, clear any existing uploaded logo state
        clearUploadedLogo();
      }

      // Load Pattern Texture if URL exists
      if (loadDesignConfig.uploadedPatternUrl) {
        console.log(
          "Loading pattern texture from URL:",
          loadDesignConfig.uploadedPatternUrl
        );
        textureLoader.load(
          loadDesignConfig.uploadedPatternUrl,
          (texture) => {
            // Success callback
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.flipY = false;
            texture.repeat.set(1, 1);
            texture.needsUpdate = true;
            setUploadedPatternTexture(texture);
            setUploadedPatternUrl(loadDesignConfig.uploadedPatternUrl!); // Set the URL state
            console.log("Saved pattern texture loaded successfully.");
          },
          undefined, // Progress callback (optional)
          (error) => {
            // Error callback
            console.error("Error loading saved pattern texture:", error);
            toast.error("Failed to load saved pattern image.");
            setUploadedPatternTexture(null); // Clear texture on error
            setUploadedPatternUrl(null); // Clear URL on error
          }
        );
      } else {
        // If no saved pattern URL, clear any existing uploaded pattern state
        clearUploadedPattern();
      }

      // Clear the config from the store so it doesn't reload on refresh/revisit
      setLoadDesignConfig(null);
      console.log("Cleared loadDesignConfig from store.");
    } else if (!loadDesignConfig && availableColors) {
      // If no config to load, but colors are available, set default color
      // Check if shirtColor is already set to avoid overwriting during initial render cycles
      if (!shirtColor) {
        setShirtColor(COLOR_PALETTE.white);
      }
    }
    // Depend on availableColors to ensure color mapping/setting happens after colors are fetched
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableColors]); // Remove loadDesignConfig, only depend on availableColors

  // Define materials configuration - apply pattern mirrored on back
  const materials = useMemo<TShirtMaterials>(() => {
    const baseMaterialProps = {
      roughness: 0.8,
      metalness: 0.7,
      side: THREE.DoubleSide,
      color: parseInt(shirtColor.replace("#", "0x")), // Always apply shirtColor
    };

    // Create distinct clones for front/sleeves and back patterns
    let frontPattern: THREE.Texture | null = null;
    let backPattern: THREE.Texture | null = null;

    if (currentPatternTexture) {
      // Clone for front/sleeves (no mirroring)
      frontPattern = currentPatternTexture.clone();
      frontPattern.needsUpdate = true;
      frontPattern.repeat.set(1, 1);
      frontPattern.wrapS = THREE.RepeatWrapping;
      frontPattern.wrapT = THREE.RepeatWrapping;

      // Clone for back (mirrored)
      backPattern = currentPatternTexture.clone();
      backPattern.needsUpdate = true;
      backPattern.repeat.set(-1, 1); // Mirror horizontally
      backPattern.wrapS = THREE.RepeatWrapping;
      backPattern.wrapT = THREE.RepeatWrapping;
    }

    return {
      rightSleeve: {
        ...baseMaterialProps,
        map: isLogoMode ? null : frontPattern, // Use non-mirrored clone
      },
      leftSleeve: {
        ...baseMaterialProps,
        map: isLogoMode ? null : frontPattern, // Use non-mirrored clone
      },
      front: {
        // FIX: Renamed from frontBody
        ...baseMaterialProps,
        map: isLogoMode ? null : frontPattern, // Use non-mirrored clone
      },
      back: {
        // FIX: Renamed from backBody
        ...baseMaterialProps,
        map: isLogoMode ? null : backPattern, // Use mirrored clone
      },
      collar: {
        ...baseMaterialProps,
        map: null, // Collar usually doesn't have pattern/logo
      },
    };
  }, [shirtColor, currentPatternTexture, isLogoMode]); // Recompute when color, pattern, or mode changes

  // Toggle between logo and pattern mode
  const toggleMode = useCallback(() => {
    setIsLogoMode((prev) => !prev);
  }, []);

  // Specific upload/clear handlers using the generic creators
  const handleLogoUpload = createUploadHandler(
    uploadedLogoUrl,
    setUploadedLogoUrl,
    setUploadedLogoTexture,
    setLogoFileToUpload,
    logoFileInputRef,
    "logo",
    { flipY: true } // Logo needs flipping
  );
  const clearUploadedLogo = createClearHandler(
    uploadedLogoUrl,
    setUploadedLogoUrl,
    setUploadedLogoTexture,
    setLogoFileToUpload
  );

  const handlePatternUpload = createUploadHandler(
    uploadedPatternUrl,
    setUploadedPatternUrl,
    setUploadedPatternTexture,
    setPatternFileToUpload,
    patternFileInputRef,
    "pattern",
    { wrap: THREE.RepeatWrapping } // Pattern needs repeat wrapping
  );
  const clearUploadedPattern = createClearHandler(
    uploadedPatternUrl,
    setUploadedPatternUrl,
    setUploadedPatternTexture,
    setPatternFileToUpload
  );

  // Callback for when AI image is generated and applied
  // FIX: Moved definition before handleGenerate
  const onImageGenerated = useCallback(
    (imageUrl: string) => {
      // This function is likely called by the AI generation logic
      // It needs to load the generated image URL as a texture
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        imageUrl,
        (texture) => {
          // Assuming AI generated images are for the logo
          texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.flipY = true; // Logos are typically flipped
          texture.needsUpdate = true;
          setUploadedLogoTexture(texture);
          setUploadedLogoUrl(imageUrl); // Store the URL
          setLogoFileToUpload(null); // Clear any pending file upload
          setIsLogoMode(true); // Switch to logo mode
          console.log("AI generated logo texture loaded:", texture);
          toast.success("AI image applied as logo!");
        },
        undefined,
        (error) => {
          console.error("Error loading AI generated texture:", error);
          toast.error("Failed to apply AI generated image.");
        }
      );
    },
    [setUploadedLogoTexture, setUploadedLogoUrl, setLogoFileToUpload]
  );

  // Placeholder for AI image generation logic
  const handleGenerate = useCallback(async () => {
    // ... (existing generation logic)
  }, [text, onImageGenerated]); // Dependencies for generation

  // Calculate dynamic min/max for X offset based on scale
  const { offsetXMin, offsetXMax } = useMemo(() => {
    // Example calculation: Allow offset up to half the logo width from center
    // This assumes the logo texture aspect ratio is roughly 1:1 or known
    // Adjust the factor (0.5) based on desired movement range relative to scale
    const maxOffset = (1 - logoScale) / 2;
    return { offsetXMin: -maxOffset, offsetXMax: maxOffset };
  }, [logoScale]);

  // Reset design state
  const handleReset = useCallback(() => {
    setText("");
    setShirtColor(COLOR_PALETTE.white); // Reset to default color
    setIsLogoMode(false); // Default to pattern mode? Or keep current mode?
    clearUploadedLogo();
    clearUploadedPattern();
    setLogoScale(0.15);
    setLogoOffset(new THREE.Vector2(0, 0.04));
    setLogoTargetPart("front");
    // Reset camera via ref if needed (optional, depends if user interaction should reset view)
    // resetCameraView();
    toast.success("Design reset to defaults.");
  }, [
    clearUploadedLogo,
    clearUploadedPattern,
    setText,
    setShirtColor,
    setIsLogoMode,
    setLogoScale,
    setLogoOffset,
    setLogoTargetPart,
  ]); // Add missing dependencies

  // Handler for selecting a saved design
  const handleDesignSelect = useCallback(
    (design: SavedDesign) => {
      console.log("Design selected in TShirtPanel:", design);
      // Use the Zustand store to trigger loading the selected design
      // Ensure the store's state structure matches what useEffect expects
      useDesignLoaderStore.setState({ loadDesignConfig: design });
      // Optionally switch to the relevant tab (e.g., 'style' or 'text')
      setActiveTab("style"); // Switch to style tab to see changes
      toast.success(`Loading design: ${design.designName || "Saved Design"}`);
    },
    [setActiveTab]
  ); // Dependency on setActiveTab

  return (
    // Responsive layout: Full height, vertical stack default, row layout on md+ screens
    // Use theme colors (e.g., bg-background, text-foreground)
    <div className="flex flex-col md:flex-row h-[94vh] max-h-full bg-background text-foreground">
      {/* 3D View Panel - Adjust height/width for responsiveness */}
      {/* Ensure TooltipProvider wraps the area containing tooltips */}
      <TooltipProvider>
        <div className="w-full md:w-[60%] lg:w-[65%] h-[55vh] md:h-full relative">
          {" "}
          {/* Adjusted mobile height */}
          <Scene
            canvasRef={canvasRef} // Pass the ref
            materials={materials} // Pass computed materials
            shirtColor={shirtColor} // FIX: Pass shirtColor
            logoTexture={currentLogoTexture}
            isLogoMode={isLogoMode}
            logoTargetPart={logoTargetPart}
            logoScale={logoScale}
            logoOffset={logoOffset}
            controlsRef={controlsRef} // Pass the controls ref
          />
          {/* Desktop Controls - Use Shadcn Tooltip and Button */}
          <div className="hidden lg:flex absolute bottom-4 left-4 right-4 justify-center items-center space-x-2 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleScreenshot}
                  className="bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Download Screenshot</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download Screenshot</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetCameraView}
                  className="bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">Reset Camera View</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Camera View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    /* Add share logic */
                    toast("Share feature coming soon!");
                  }}
                  className="bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share Design</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share Design (Coming Soon)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {/* Mobile Menu Toggle - Use Shadcn Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-colors z-30"
          >
            {showMobileMenu ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle Menu</span>
          </Button>
          {/* Mobile Menu - Use theme colors and better structure */}
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden absolute top-16 right-4 bg-popover text-popover-foreground rounded-md border border-border shadow-lg p-2 space-y-1 z-20 w-40" // Adjusted width and styling
            >
              <Button
                variant="ghost" // Use ghost variant for menu items
                size="sm" // Use small size
                onClick={() => {
                  handleScreenshot();
                  setShowMobileMenu(false);
                }}
                className="w-full justify-start gap-2" // Align text left, add gap
              >
                <Camera className="h-4 w-4" /> Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetCameraView();
                  setShowMobileMenu(false);
                }}
                className="w-full justify-start gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Reset View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  /* Add share logic */
                  toast("Share feature coming soon!");
                  setShowMobileMenu(false);
                }}
                className="w-full justify-start gap-2"
              >
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </motion.div>
          )}
        </div>
      </TooltipProvider>{" "}
      {/* Close TooltipProvider */}
      {/* Customization Panel - Adjust width/height for responsiveness, add border */}
      <div className="w-full md:w-[40%] lg:w-[35%] h-[calc(94vh-55vh)] md:h-full bg-card text-card-foreground flex flex-col relative border-t md:border-t-0 md:border-l border-border">
        {" "}
        {/* Adjusted mobile height */}
        <CustomizationPanel
          productId={productId}
          sizeId={sizeId}
          text={text}
          setText={setText}
          isGenerating={isGenerating}
          handleGenerate={handleGenerate} // Pass the actual handler
          handleScreenshot={handleScreenshot} // Pass down screenshot handler
          getCanvasDataURL={getCanvasDataURL} // Pass down data URL getter
          resetCameraView={resetCameraView} // Pass down reset view function
          // setCameraPosition={setCameraPosition} // Prop removed from CustomizationPanel
          handleReset={handleReset} // Pass down the reset handler
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onImageGenerated={onImageGenerated} // Pass down image generated handler
          // Logo/Style Props
          isLogoMode={isLogoMode}
          logoTargetPart={logoTargetPart}
          setLogoTargetPart={setLogoTargetPart}
          logoScale={logoScale}
          logoOffset={logoOffset}
          uploadedLogoTexture={uploadedLogoTexture}
          toggleMode={toggleMode}
          handleImageUpload={handleLogoUpload} // Pass specific logo handler
          clearUploadedLogo={clearUploadedLogo}
          fileInputRef={logoFileInputRef} // Pass logo ref
          setLogoScale={setLogoScale}
          setLogoOffset={setLogoOffset}
          offsetXMin={offsetXMin}
          offsetXMax={offsetXMax}
          shirtColor={shirtColor}
          setShirtColor={setShirtColor}
          // Simplified Pattern Props
          uploadedPatternTexture={uploadedPatternTexture}
          handlePatternUpload={handlePatternUpload} // Pass specific pattern handler
          clearUploadedPattern={clearUploadedPattern}
          patternFileInputRef={patternFileInputRef} // Pass pattern ref
          // File objects
          logoFileToUpload={logoFileToUpload}
          patternFileToUpload={patternFileToUpload}
          // URLs
          uploadedLogoUrl={uploadedLogoUrl}
          uploadedPatternUrl={uploadedPatternUrl}
          // Colors
          availableColors={availableColors}
          onDesignSelect={handleDesignSelect} // Pass the handler function
        />
      </div>
    </div>
  );
};

export default TShirtDesigner;
