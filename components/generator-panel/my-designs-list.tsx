"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axiosInstance from "@/lib/axiosInstance"; // Import the configured axios instance
import Image from "next/image"; // Using next/image for optimization
import { Loader2 } from "lucide-react"; // Assuming lucide-react for spinner

// Define the SavedDesign type based on expected API response and usage in CustomizationPanel
export interface SavedDesign {
  id: string;
  userId: string; // Keep if needed elsewhere, not directly used for loading state
  designName?: string; // Optional name
  designImageUrl: string; // Preview image
  productId: string;
  colorId: string;
  sizeId: string; // Added based on save logic in CustomizationPanel
  customText: string | null;
  shirtColorHex: string; // Added
  isLogoMode: boolean; // Added
  logoScale: number | null; // Added
  logoOffsetX: number | null; // Added
  logoOffsetY: number | null; // Added
  logoTargetPart: "front" | "back" | null; // Added
  uploadedLogoUrl: string | null; // Renamed from logoUrl for clarity
  uploadedPatternUrl: string | null; // Renamed from textureUrl for clarity
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
}

interface MyDesignsListProps {
  onDesignSelect: (design: SavedDesign) => void;
}

const MyDesignsList: React.FC<MyDesignsListProps> = ({ onDesignSelect }) => {
  const { data: session, status } = useSession();
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyDesigns = async () => {
    if (status !== "authenticated" || !session?.accessToken) {
      // Don't fetch if not authenticated, render logic will handle the message
      setDesigns([]); // Clear designs if user logs out
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the local API route within the storefront
      const response = await axiosInstance.get(
        // Use axiosInstance
        `/api/designs/my-designs`,
        {
          withCredentials: true, // Ensure cookies are sent for same-origin auth
          // Authorization header is likely not needed for cookie-based session with getServerSession
        }
      );
      // Ensure the response data is an array
      if (Array.isArray(response.data)) {
        setDesigns(response.data);
      } else {
        console.error("API response is not an array:", response.data);
        setError("Failed to load designs. Unexpected data format.");
        setDesigns([]);
      }
    } catch (err) {
      console.error("Error fetching designs:", err);
      setError("Failed to load your designs. Please try again later.");
      setDesigns([]); // Clear designs on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch designs when the component mounts and the user is authenticated,
    // or when the status changes to authenticated
    if (status === "authenticated") {
      fetchMyDesigns();
    } else {
      // Clear designs if status is not authenticated (e.g., loading, unauthenticated)
      setDesigns([]);
      setError(null); // Clear errors as well
    }
    // Dependency array includes status to refetch when login status changes
  }, [status, session?.accessToken]); // Also depend on accessToken in case it changes

  // --- Rendering Logic ---

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center text-muted-foreground p-4">
        Please log in to view your saved designs.
      </div>
    );
  }

  // Authenticated state handling
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading your designs...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  if (designs.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        You haven&apos;t saved any designs yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-1">
      {designs.map((design) => (
        <div
          key={design.id}
          className="relative aspect-square rounded-md overflow-hidden cursor-pointer group"
          onClick={() => onDesignSelect(design)}
        >
          <Image
            src={design.designImageUrl}
            alt={design.designName || `Design ${design.id}`}
            fill // Use fill to cover the container
            sizes="(max-width: 768px) 50vw, 33vw" // Provide sizes for optimization
            className="object-cover group-hover:opacity-80 transition-opacity"
            priority={false} // Avoid marking all as priority
          />
          {/* Optional: Add an overlay or design name on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
        </div>
      ))}
    </div>
  );
};

export default MyDesignsList;
