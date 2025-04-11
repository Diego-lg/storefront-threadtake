"use client"; // Make it a client component

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { Billboard as BillboardType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Type definition for the response from /api/community/designs
// (Should match the backend API response structure)
interface SharedDesignResponse {
  id: string;
  designImageUrl: string | null;
  customText: string | null;
  createdAt: string; // Or Date if parsed
  product: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string | null;
    image: string | null; // User avatar/profile picture
  };
}

interface BillboardProps {
  data: BillboardType;
}

const Billboard: React.FC<BillboardProps> = ({ data }) => {
  const [sharedDesigns, setSharedDesigns] = useState<SharedDesignResponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCommunityBillboard = data.label === "Community";

  useEffect(() => {
    if (isCommunityBillboard) {
      const fetchCommunityDesigns = async () => {
        setIsLoading(true);
        setError(null);
        const communityDesignsUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/community/designs`; // Use the correct endpoint

        try {
          const response = await axios.get<SharedDesignResponse[]>(
            communityDesignsUrl
          );
          setSharedDesigns(response.data);
        } catch (err) {
          console.error("Failed to fetch community designs:", err);
          setError("Could not load community designs. Please try again later.");
          setSharedDesigns([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCommunityDesigns();
    } else {
      // Reset state if the billboard is not the community one
      setSharedDesigns([]);
      setIsLoading(false);
      setError(null);
    }
  }, [data.id, isCommunityBillboard]); // Refetch if billboard ID changes or it becomes/stops being the community one

  // --- Render Original Billboard ---
  const renderOriginalBillboard = () => (
    <div className="p-4 sm:p-6 lg:p-8 rounded-xl overflow-hidden">
      {/* Use Next/Image instead of background-image */}
      <div className="rounded-xl relative aspect-square md:aspect-[2.4/1] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {data?.imageUrl && (
          <Image
            src={data.imageUrl}
            alt={data.label || "Billboard Image"}
            fill
            className="object-cover" // Use object-cover like other images
            priority // Prioritize loading billboard images
          />
        )}
        {/* Overlay for text */}
        <div className="absolute inset-0 h-full w-full flex flex-col justify-center items-center text-center gap-y-8 bg-black bg-opacity-40">
          <div className="font-bold text-3xl sm:text-5xl lg:text-6xl sm:max-w-xl max-w-xs text-white drop-shadow-lg p-4 rounded">
            {data.label}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Render Community Designs ---
  const renderCommunityDesigns = () => {
    if (isLoading) {
      // Show skeleton loaders while fetching
      return (
        <div className="p-4 sm:p-6 lg:p-8">
          <h2 className="text-3xl font-bold text-center mb-6">
            Community Designs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="border rounded-lg overflow-hidden shadow-lg bg-white dark:bg-zinc-800 dark:border-zinc-700"
              >
                <Skeleton className="aspect-square w-full bg-gray-200 dark:bg-zinc-700" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4 bg-gray-200 dark:bg-zinc-700" />
                  <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-zinc-700" />
                  <Skeleton className="h-4 w-1/4 bg-gray-200 dark:bg-zinc-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 text-center text-red-600 dark:text-red-400">
          <h2 className="text-3xl font-bold mb-4">Community Designs</h2>
          <p>{error}</p>
        </div>
      );
    }

    if (sharedDesigns.length === 0) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 text-center text-gray-500 dark:text-gray-400">
          <h2 className="text-3xl font-bold mb-4">Community Designs</h2>
          <p>No community designs shared yet. Be the first!</p>
        </div>
      );
    }

    // Display fetched designs
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h2 className="text-3xl font-bold text-center mb-6">
          Community Designs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sharedDesigns.map((design) => (
            <div
              key={design.id}
              className="border rounded-lg overflow-hidden shadow-lg bg-white dark:bg-zinc-800 dark:border-zinc-700 group"
            >
              <div className="aspect-square relative bg-gray-100 dark:bg-zinc-700">
                {design.designImageUrl ? (
                  <Image
                    src={design.designImageUrl}
                    alt={`Community design by ${design.user.name || "User"}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    No Preview
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1">
                <p
                  className="font-semibold text-md text-black dark:text-white truncate"
                  title={design.product.name}
                >
                  {design.product.name} {/* Show base product name */}
                </p>
                {design.customText && (
                  <p
                    className="text-sm text-gray-600 dark:text-gray-300 truncate"
                    title={design.customText}
                  >
                    &quot;{design.customText}&quot;
                  </p>
                )}
                <div className="flex items-center pt-1">
                  {design.user.image && (
                    <Image
                      src={design.user.image}
                      alt={design.user.name || "User avatar"}
                      width={20}
                      height={20}
                      className="rounded-full mr-2"
                    />
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    By {design.user.name || "Anonymous"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render conditionally based on the billboard label
  return isCommunityBillboard
    ? renderCommunityDesigns()
    : renderOriginalBillboard();
};

export default Billboard;
