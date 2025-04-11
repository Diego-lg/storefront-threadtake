import Image from "next/image";
import { notFound } from "next/navigation";
import Container from "@/components/ui/container";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Replaced by CreatorProfileCard
import CreatorProfileCard from "@/components/creator/CreatorProfileCard"; // Import the new card
import RatingsSection from "@/components/ratings/ratings-section"; // Import the new component
import { Star, Eye } from "lucide-react";
// import Button from "@/components/ui/button"; // No longer needed directly here
import { formatPrice } from "@/lib/utils";
import DesignActions from "./components/design-actions";
import { Product, Size } from "@/types"; // Import Product and Size types

// Define the expected shape of the detailed design data
// (Should match backend response from GET /api/designs/[designId])
interface CreatorInfo {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null; // Added bio field
  profileCardBackground?: string | null; // Added for Phase 2
}
interface DesignDetails {
  id: string;
  productId: string;
  customText: string | null;
  designImageUrl: string | null;
  mockupImageUrl: string | null;
  description: string | null;
  tags: string[] | null;
  viewCount: number | null;
  isShared: boolean; // Should be true if fetched successfully
  averageRating: number | null;
  ratingCount: number | null;
  usageRights: string | null;
  createdAt: string;
  updatedAt: string;
  product: Product; // Use the imported Product type
  color: {
    id: string;
    name: string;
    value: string;
  };
  // size: { // Remove single size object
  //   id: string;
  //   name: string;
  //   value: string;
  // };
  availableSizes: Size[]; // Add array of available sizes
  creator: CreatorInfo | null; // Renamed from 'user' in backend response
}

// Function to fetch single design data (server-side)
async function getDesignDetails(
  designId: string
): Promise<DesignDetails | null> {
  try {
    // Use NEXT_PUBLIC_API_URL for client-side fetch simulation if needed,
    // but prefer backend URL for server components
    const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/designs/${designId}`;
    const res = await fetch(apiUrl, {
      next: { revalidate: 60 }, // Revalidate frequently for view count, adjust as needed
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch design details: ${res.statusText}`);
    }
    const data = await res.json();
    // Ensure isShared is true, otherwise treat as not found for public view
    if (!data?.isShared) return null;
    return data;
  } catch (error) {
    console.error("Error fetching design details:", error);
    return null;
  }
}

// The Page Component (Server Component)
const DesignDetailPage = async ({
  params,
}: {
  params: { designId: string };
}) => {
  const design = await getDesignDetails(params.designId);

  if (!design) {
    notFound(); // Trigger Next.js 404 page
  }

  const displayImageUrl =
    design.mockupImageUrl ||
    design.designImageUrl ||
    design.product.images?.[0]?.url;
  const displayAltText = design.mockupImageUrl
    ? `Mockup for design on ${design.product.name}`
    : design.designImageUrl
    ? `Preview for design on ${design.product.name}`
    : design.product.name;

  // --- Calculate Dynamic Background Style for Image Border ---
  let imageBorderStyle: React.CSSProperties = {};
  const bgValue = design.creator?.profileCardBackground;
  if (bgValue) {
    if (bgValue.startsWith("#")) {
      // Basic hex color check
      imageBorderStyle = { backgroundColor: bgValue };
    } else if (bgValue.startsWith("http") || bgValue.startsWith("/")) {
      // Basic URL check
      imageBorderStyle = {
        backgroundImage: `url(${bgValue})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }
    // Add more checks if needed (e.g., gradients)
  } else {
    // Optional: Define a default background if none is set by the creator
    // imageBorderStyle = { backgroundColor: '#e5e7eb' }; // Example: light gray border
  }
  // --- End Dynamic Background Style ---

  // Prepare data subset needed for the client component
  const designDataForCart = {
    id: design.id,
    // Use the ID from the product object returned by the API (derived or base)
    productId: design.product.id,
    color: design.color,
    // size: design.size, // Remove single size
    availableSizes: design.availableSizes, // Pass available sizes
    designImageUrl: design.designImageUrl,
    mockupImageUrl: design.mockupImageUrl,
    product: design.product,
  };

  return (
    <Container>
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        {" "}
        {/* Standard content padding */}
        <div className="lg:grid lg:grid-cols-12 lg:items-start gap-x-8">
          {/* Image Gallery/Display */}
          <div className="lg:col-span-7">
            {/* Outer div for border effect */}
            <div
              style={imageBorderStyle}
              className="aspect-square relative rounded-lg overflow-hidden p-1 md:p-2" // Apply dynamic bg, padding for border
            >
              {/* Inner div for solid background behind image */}
              <div className="relative w-full h-full bg-gray-100 dark:bg-zinc-800 rounded-md overflow-hidden">
                {displayImageUrl ? (
                  <Image
                    src={displayImageUrl}
                    alt={displayAltText}
                    fill
                    className="object-contain" // Use contain to see whole image
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    No Image
                  </div>
                )}
              </div>
            </div>
            {/* TODO: Add image gallery if multiple images/mockups */}
          </div>

          {/* Design Info */}
          <div className="mt-8 lg:mt-0 lg:col-span-5 space-y-6">
            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {design.product.name}
            </h1>

            {/* Price */}
            <p className="text-2xl text-gray-900 dark:text-gray-200">
              {formatPrice(Number(design.product.price))}
            </p>

            {/* Creator Card & Stats */}
            <div className="space-y-4 border-b pb-4 dark:border-zinc-700">
              {/* Creator Profile Card */}
              <CreatorProfileCard creator={design.creator} />

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                {/* Rating Display */}
                {design.ratingCount !== null &&
                  design.ratingCount > 0 &&
                  design.averageRating !== null && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Star
                        className="w-4 h-4 text-yellow-400 mr-1"
                        fill="currentColor"
                      />
                      <span>{design.averageRating.toFixed(1)}</span>
                      <span className="ml-1">({design.ratingCount})</span>
                    </div>
                  )}
                {/* View Count */}
                {design.viewCount !== null && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Eye className="w-4 h-4 mr-1" />
                    <span>{design.viewCount} views</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {design.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Description
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {design.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {design.tags && design.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Tags
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {design.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-200 dark:bg-zinc-700 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Rights */}
            {design.usageRights && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Usage Rights
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {design.usageRights}
                </p>
              </div>
            )}

            {/* Use Client Component for Add to Cart Button */}
            <DesignActions design={designDataForCart} />
          </div>
        </div>
        {/* Ratings & Reviews Section */}
        <div className="mt-16 pt-10 border-t dark:border-zinc-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Ratings & Reviews
          </h2>
          {/* Render the RatingsSection component */}
          <RatingsSection designId={design.id} />
          {/* Placeholder for RatingsSection component */}
          {/* <p className="text-gray-500 dark:text-gray-400">
              (Ratings section will go here)
            </p> */}
          {/* <RatingsSection designId={design.id} /> */}
        </div>
      </div>{" "}
      {/* Close inner content padding div */}
    </Container>
  );
};

export default DesignDetailPage;
