"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Link from "next/link"; // Import Link for navigation
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import {
  Loader2,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Share2,
  Star, // Add Star icon for ratings
  ShoppingCart, // Import ShoppingCart icon
} from "lucide-react";

import { Button } from "@/components/ui/button"; // Corrected to named import
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  // DropdownMenuCheckboxItem, // Removed unused import
} from "@/components/ui/dropdown-menu";
import { Product, Size, Color } from "@/types"; // Assuming base types exist
import useCart from "@/hooks/use-cart"; // Import the cart hook

// Define types based on MyDesignsClient and Phase 1 plan
// Assuming backend provides creator username and new fields
interface Creator {
  id: string;
  name?: string | null; // Creator's public name
  image?: string | null; // Add image field
  bio?: string | null; // Added bio field
  profileCardBackground?: string | null; // Added for Phase 2
}

// Extend Product type slightly for cart item structure if needed
// Or ensure the base Product type in types.ts is sufficient
interface CartProduct extends Product {
  // Add any specific fields needed for cart if not in base Product
  // e.g., maybe the specific design ID or image?
  designId?: string;
  designImageUrl?: string | null;
}

// Updated interface to match the mapped response from /api/marketplace/designs
interface MarketplaceDesignItem {
  // --- Key identifiers ---
  id: string; // SavedDesign ID (used for linking, key)
  productId: string; // Derived Product ID (used for cart)

  // --- Product details (from derived product) ---
  name: string; // Derived product name (e.g., "Design by Creator")
  price: number; // Use Prisma Decimal or number depending on backend response mapping
  productImage: string | null; // Image URL from derived product

  // --- Design details (from original savedDesign) ---
  designImageUrl?: string | null;
  mockupImageUrl?: string | null;
  customText?: string | null;
  description?: string | null;
  tags?: string[] | null;
  usageRights?: string | null;
  color: Color; // Full color object
  size: Size; // Full size object

  // --- Creator details (from savedDesign.user) ---
  creator?: Creator | null;

  // --- Stats (from savedDesign) ---
  viewCount?: number | null;
  averageRating?: number | null;
  ratingCount?: number | null;
  createdAt: string; // Design creation time
  updatedAt: string;
}

const MarketplaceDesignsClient = () => {
  // Renamed component
  // const router = useRouter(); // Removed unused router
  const cart = useCart(); // Initialize cart hook
  const [designs, setDesigns] = useState<MarketplaceDesignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Phase 1 State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTags] = useState<string[]>([]); // For filtering
  const [sortBy, setSortBy] = useState<"newest" | "views" | "rating">("newest"); // Add 'rating' sort option

  // --- Fetch Shared Designs ---
  const fetchSharedDesigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // TODO: Confirm actual backend endpoint for shared designs
    // Assuming '/api/designs/shared' or similar for now
    const sharedDesignsUrl = `/api/marketplace/designs`; // Use the Next.js API proxy route

    try {
      // TODO: Add query params for search, filter, sort based on state
      const response = await axios.get<MarketplaceDesignItem[]>(
        sharedDesignsUrl,
        {
          // Use updated interface
          params: {
            search: searchTerm || undefined, // Send search term if present
            tags: activeTags.length > 0 ? activeTags.join(",") : undefined, // Send tags if selected
            sort: sortBy, // Send sort preference
            shared: true, // Explicitly request only shared designs
          },
        }
      );
      setDesigns(response.data);
    } catch (err) {
      console.error("Failed to fetch shared designs:", err);
      setError("Could not load marketplace designs. Please try again later."); // Updated error message
      toast.error("Could not load marketplace designs."); // Updated toast message
      setDesigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeTags, sortBy]); // Refetch when state changes

  useEffect(() => {
    fetchSharedDesigns();
  }, [fetchSharedDesigns]);

  // --- Filtering Logic (Example - needs refinement based on actual data/UI) ---
  const filteredDesigns = useMemo(() => {
    // Basic client-side filtering example if backend doesn't support it fully
    // Ideally, backend handles search/filter/sort via query params
    return designs; // Placeholder - assuming backend handles filtering
  }, [designs /*, searchTerm, activeTags, sortBy */]);

  // --- Handlers ---
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Optional: Debounce fetchSharedDesigns call here
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchSharedDesigns(); // Trigger fetch on explicit submit/enter
  };

  // Removed unused handleTagFilterChange function
  // --- Add to Cart Handler ---
  const handleAddToCart = (
    event: React.MouseEvent<HTMLButtonElement>,
    design: MarketplaceDesignItem // Use updated interface
  ) => {
    event.stopPropagation(); // Prevent triggering link navigation if button is inside Link

    // Map MarketplaceDesignItem to the structure expected by useCart hook
    // The cart likely needs the actual PRODUCT ID to purchase, along with display info.
    const productToAdd: CartProduct = {
      // Base Product fields expected by CartProduct (adjust CartProduct if needed)
      id: design.productId, // IMPORTANT: Use the derived Product ID for the cart item ID
      name: design.name, // Use the derived product name
      price: design.price.toString(), // Convert number to string for cart
      images: design.productImage
        ? [{ id: design.productId + "_img", url: design.productImage }]
        : [], // Use derived product image
      // Include other fields from Product type if CartProduct expects them (e.g., category, isFeatured - likely not needed for cart)
      // Add a mock billboard to satisfy the Category type for this placeholder
      category: {
        id: "derived",
        name: "Marketplace Design",
        billboard: { id: "mock", label: "Mock Billboard", imageUrl: "" },
      }, // Placeholder category if needed by CartProduct type
      isFeatured: false,

      // Add selected color/size
      color: design.color,
      size: design.size,

      // Add design-specific info if needed by cart/checkout logic
      designId: design.id, // Keep the original SavedDesign ID for reference if needed
      designImageUrl: design.designImageUrl || design.mockupImageUrl, // Use best available image for cart display
    };
    cart.addItem(productToAdd);
    toast.success(`${design.name} added to cart.`); // Use derived product name in toast
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
        <p className="ml-2 text-gray-500 dark:text-gray-400">
          Loading marketplace designs... {/* Updated loading text */}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-600 dark:text-red-400">{error}</p>
    );
  }

  return (
    <div>
      {/* --- Phase 1: Search, Filter, Sort Controls --- */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-grow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search designs by description or tags..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full"
            />
          </div>
        </form>
        {/* Placeholder for Tag Filters */}
        <Button disabled>
          {" "}
          {/* Removed unsupported variant prop */}
          <Filter className="mr-2 h-4 w-4" /> Filters (Tags)
        </Button>
        {/* Sorting Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              {" "}
              {/* Removed unsupported variant prop */}
              <ArrowUpDown className="mr-2 h-4 w-4" /> Sort By:{" "}
              {sortBy === "newest"
                ? "Newest"
                : sortBy === "views"
                ? "Popularity"
                : "Rating"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortBy("newest")}>
              Newest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("views")}>
              Popularity (Views)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("rating")}>
              Rating
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- Design Grid --- */}
      {filteredDesigns.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No shared designs found matching your criteria.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredDesigns.map((design) => (
            <div
              key={design.id}
              className="border rounded-lg overflow-hidden shadow-lg bg-white dark:bg-zinc-800 dark:border-zinc-700 flex flex-col group"
            >
              {/* Image Section - Wrapped in Link */}
              <Link
                href={`/designs/${design.id}`}
                className="block aspect-square relative bg-gray-100 dark:bg-zinc-700"
              >
                {/* Prioritize Mockup > Design Preview > Product Image */}
                {/* Use derived product image first, fallback to mockup/design */}
                {design.productImage ||
                design.mockupImageUrl ||
                design.designImageUrl ? (
                  <Image
                    src={
                      design.productImage || // Prioritize derived product image
                      design.mockupImageUrl ||
                      design.designImageUrl ||
                      "/placeholder.png" // Fallback
                    }
                    alt={
                      design.name // Use derived product name for alt text
                    }
                    fill
                    className="object-cover group-hover:opacity-75 transition-opacity" // Added hover effect
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-zinc-600">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      No Image
                    </span>
                  </div>
                )}
                {/* Color Swatch */}
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 shadow"
                  style={{ backgroundColor: design.color.value }}
                  title={`Color: ${design.color.name}`}
                />
                {/* Phase 1: View Count Overlay (Example) */}
                {design.viewCount !== null &&
                  design.viewCount !== undefined && (
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center">
                      <Eye size={12} className="mr-1" /> {design.viewCount}
                    </div>
                  )}
              </Link>{" "}
              {/* End Link wrapper for image */}
              {/* Info Section */}
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  {/* Optionally wrap name in Link too, or rely on image link */}
                  <p
                    className="font-semibold text-lg text-black dark:text-white truncate"
                    title={design.name} // Use derived product name
                  >
                    {design.name} {/* Display derived product name */}
                  </p>
                  {/* Phase 1: Creator Info (Avatar + Name) */}
                  {design.creator && (
                    <Link
                      href={`/creators/${design.creator.id}`} // Link to creator profile
                      className="flex items-center gap-2 mt-1 group" // Added flex, gap, mt, group
                    >
                      <Avatar className="h-5 w-5 border text-xs">
                        {" "}
                        {/* Smaller avatar */}
                        <AvatarImage
                          src={design.creator.image ?? undefined}
                          alt={design.creator.name ?? "Creator"}
                        />
                        <AvatarFallback className="text-xs">
                          {design.creator.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 truncate">
                        {design.creator.name ?? "Unknown Creator"}
                      </span>
                    </Link>
                  )}
                  {/* Phase 2: Display Rating */}
                  {design.ratingCount !== null &&
                    design.ratingCount !== undefined &&
                    design.averageRating !== null &&
                    design.averageRating !== undefined && (
                      <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <Star
                          className="w-4 h-4 text-yellow-400 mr-1"
                          fill="currentColor"
                        />
                        <span>{design.averageRating.toFixed(1)}</span>
                        <span className="ml-1">({design.ratingCount})</span>
                      </div>
                    )}
                  {/* Phase 1: Description */}
                  {design.description && (
                    <p
                      className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2"
                      title={design.description}
                    >
                      {design.description}
                    </p>
                  )}
                  {/* Phase 1: Tags (Example Display) */}
                  {design.tags && design.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {design.tags.slice(0, 3).map(
                        (
                          tag // Limit displayed tags
                        ) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-200 dark:bg-zinc-600 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>
                  )}
                  {/* Phase 3: Display Usage Rights */}
                  {design.usageRights && (
                    <p
                      className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                      title="Usage Rights"
                    >
                      {design.usageRights}
                    </p>
                  )}
                </div>

                {/* Actions Section */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                  {/* Changed Button to Add to Cart */}
                  <Button
                    onClick={(e) => handleAddToCart(e, design)}
                    title="Add this design to cart"
                    className="flex-1 mr-2 px-4 flex items-center justify-center" // Added flex items-center justify-center for alignment
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    Add to Cart
                  </Button>
                  {/* Phase 1: Social Share Button Placeholder */}
                  <Button
                    // size="sm" // Removed unsupported prop
                    // variant="ghost" // Removed unsupported prop
                    title="Share this design (Not implemented)"
                    className="px-2" // Reduce padding for icon-only feel
                  >
                    <Share2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplaceDesignsClient; // Renamed export
