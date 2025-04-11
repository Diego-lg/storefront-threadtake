"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Session } from "next-auth"; // Import Session type
import axiosInstance from "@/lib/axiosInstance"; // Import the configured axios instance
import { AxiosError, isAxiosError } from "axios"; // Import AxiosError and isAxiosError separately
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
// TODO: Add correct import for the updateSharingStatus server action from the backend project
// import { updateSharingStatus } from ???;
import Image from "next/image";
import {
  Trash,
  UploadCloud,
  Share2,
  EyeOff,
  Pencil,
  Save,
  XCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Corrected to named import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  useDesignLoaderStore,
  DesignLoadConfig,
} from "@/hooks/use-design-loader";

// Define types
interface SavedDesignData {
  id: string;
  productId: string;
  colorId: string;
  sizeId: string;
  customText: string | null;
  createdAt: string;
  designImageUrl?: string | null;
  mockupImageUrl?: string | null;
  shirtColorHex?: string | null;
  isLogoMode?: boolean | null;
  logoScale?: number | null;
  logoOffsetX?: number | null;
  logoOffsetY?: number | null;
  logoTargetPart?: string | null;
  uploadedLogoUrl?: string | null;
  uploadedPatternUrl?: string | null;
  isShared: boolean;
  description?: string | null;
  tags?: string[] | null;
  averageRating?: number | null;
  ratingCount?: number | null;
  usageRights?: string | null;
  product: {
    id: string;
    name: string;
    images: { url: string }[];
  };
  color: {
    id: string;
    name: string;
    value: string;
  };
  size: {
    id: string;
    name: string;
    value: string;
  };
}

const MyDesignsClient = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [designs, setDesigns] = useState<SavedDesignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setLoadDesignConfig = useDesignLoaderStore(
    (state) => state.setLoadDesignConfig
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define interfaces for better typing
  interface SessionWithToken extends Session {
    accessToken?: string;
  }

  interface ErrorResponse {
    message?: string;
    // Add other potential error properties if known
  }

  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editUsageRights, setEditUsageRights] = useState("");

  const fetchDesigns = useCallback(async () => {
    if (!session?.accessToken) {
      setError("Authentication token is missing. Please log in again.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const designsUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/designs`;
    const token = (session as SessionWithToken)?.accessToken; // Use SessionWithToken
    if (!token) {
      setError("Authentication token is missing. Please log in again.");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get<SavedDesignData[]>(designsUrl, {
        // Use axiosInstance
        // headers: { Authorization: `Bearer ${token}` }, // Handled by interceptor
      });
      setDesigns(response.data);
    } catch (err) {
      console.error("Failed to fetch designs:", err);
      setError("Could not load your saved designs. Please try again later.");
      toast.error("Could not load your saved designs.");
      setDesigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }
    if (status === "authenticated") {
      fetchDesigns();
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account/designs");
    }
  }, [status, router, session, fetchDesigns]);

  const handleDelete = useCallback(
    async (designId: string) => {
      if (!confirm("Are you sure you want to delete this design?")) return;
      setIsSubmitting(true);
      const deleteUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/designs/${designId}`;
      const token = (session as SessionWithToken)?.accessToken; // Use SessionWithToken
      if (!token) {
        toast.error("Authentication token is missing. Please log in again.");
        setIsSubmitting(false);
        return;
      }
      try {
        await axiosInstance.delete(deleteUrl, {
          // Ensure axiosInstance is used
          // headers: { Authorization: `Bearer ${token}` }, // Handled by interceptor
        });
        setDesigns((prevDesigns) =>
          prevDesigns.filter((d) => d.id !== designId)
        );
        toast.success("Design deleted successfully!");
      } catch (err) {
        console.error("Failed to delete design:", err);
        toast.error("Failed to delete design. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [session]
  );

  // --- Update Design Details Handler (Handles Description, Tags, Usage Rights via PATCH API) ---
  const handleUpdateDetails = useCallback(
    async (
      designId: string,
      updates: Partial<
        Pick<SavedDesignData, "description" | "tags" | "usageRights">
      >
    ) => {
      setIsSubmitting(true);
      const updateUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/designs/${designId}`;
      const token = (session as SessionWithToken)?.accessToken; // Use SessionWithToken

      if (!token) {
        toast.error("Authentication token is missing. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      const payload: Partial<
        Pick<SavedDesignData, "description" | "tags" | "usageRights">
      > = {};
      if (updates.description !== undefined)
        payload.description = updates.description;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.usageRights !== undefined)
        payload.usageRights = updates.usageRights;

      if (Object.keys(payload).length === 0) {
        toast.error("No details changed.");
        setIsSubmitting(false);
        setEditingDesignId(null);
        return;
      }

      try {
        await axiosInstance.patch(updateUrl, payload, {
          // Ensure axiosInstance is used
          // headers: { Authorization: `Bearer ${token}` }, // Handled by interceptor
        });
        toast.success("Design details updated successfully!");
        await fetchDesigns(); // Refresh list
      } catch (err) {
        console.error("Failed to update design details:", err);
        toast.error("Failed to update design details. Please try again.");
      } finally {
        setIsSubmitting(false);
        setEditingDesignId(null);
      }
    },
    [session, fetchDesigns]
  );

  // --- Share/Unshare Handler (Uses Server Action) ---
  const handleToggleShare = useCallback(
    async (designId: string, currentIsShared: boolean) => {
      setIsSubmitting(true);
      const newIsShared = !currentIsShared;
      console.log(`Toggling share for ${designId} to ${newIsShared}`);

      try {
        // Call the backend API endpoint to update sharing status
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/designs/${designId}/share`;
        const token = (session as SessionWithToken)?.accessToken; // Use SessionWithToken
        console.log("[handleToggleShare] Token from session:", token); // Log the token

        if (!token) {
          toast.error("Authentication token is missing. Please log in again.");
          setIsSubmitting(false); // Ensure submitting state is reset
          return; // Exit early
        }

        const response = await axiosInstance.post(
          // Use axiosInstance
          apiUrl,
          { isShared: newIsShared } // Send the new status in the body
          // { headers: { Authorization: `Bearer ${token}` } } // Handled by interceptor
        );

        // Assuming backend returns { success: true } or similar on success
        // Adjust based on actual backend response if needed
        const result = {
          success: response.status === 200 || response.status === 201,
          error: response.statusText,
        };

        if (result.success) {
          toast.success(
            `Design ${newIsShared ? "shared" : "unshared"} successfully!`
          );
          setDesigns((prev) =>
            prev.map((d) =>
              d.id === designId ? { ...d, isShared: newIsShared } : d
            )
          );
          // await fetchDesigns(); // Optional refetch
        } else {
          console.error("Server action failed:", result.error);
          toast.error(
            `Failed to ${newIsShared ? "share" : "unshare"} design: ${
              result.error || "Unknown error"
            }`
          );
        }
      } catch (err) {
        console.error("Error calling share API:", err);
        // Attempt to get more specific error from axios response
        let errorMessage = "Unknown error";
        if (isAxiosError(err)) {
          // Use imported isAxiosError
          const axiosError = err as AxiosError<ErrorResponse>;
          errorMessage =
            axiosError.response?.data?.message || axiosError.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        toast.error(
          `Failed to ${
            newIsShared ? "share" : "unshare"
          } design: ${errorMessage}`
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [session] // Add session as dependency because we use the token
  );

  const handleLoad = (design: SavedDesignData) => {
    const config: DesignLoadConfig = {
      productId: design.productId,
      colorId: design.colorId,
      sizeId: design.sizeId,
      customText: design.customText,
      isLogoMode: design.isLogoMode,
      logoScale: design.logoScale,
      logoOffsetX: design.logoOffsetX,
      logoOffsetY: design.logoOffsetY,
      logoTargetPart: design.logoTargetPart,
      uploadedLogoUrl: design.uploadedLogoUrl,
      uploadedPatternUrl: design.uploadedPatternUrl,
    };
    setLoadDesignConfig(config);
    router.push("/generator");
  };

  if (isLoading || status === "loading") {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        Loading your designs...
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-center text-red-600 dark:text-red-400">{error}</p>
    );
  }
  if (designs.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        You haven&apos;t saved any designs yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {designs.map((design) => {
        const isEditing = editingDesignId === design.id;
        return (
          <div
            key={design.id}
            className="border rounded-lg overflow-hidden shadow-lg bg-white dark:bg-zinc-800 dark:border-zinc-700 relative group flex flex-col"
          >
            <div className="aspect-square relative bg-gray-100 dark:bg-zinc-700">
              {design.mockupImageUrl ||
              design.designImageUrl ||
              design.product.images?.[0]?.url ? (
                <Image
                  src={
                    design.mockupImageUrl ||
                    design.designImageUrl ||
                    design.product.images[0].url
                  }
                  alt={
                    design.mockupImageUrl
                      ? `User design mockup`
                      : design.designImageUrl
                      ? `User saved design preview`
                      : `Design based on ${design.product.name}`
                  }
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  No Preview
                </div>
              )}
              <div
                className="absolute top-2 right-2 w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 shadow"
                style={{ backgroundColor: design.color.value }}
                title={`Color: ${design.color.name}`}
              />
            </div>
            <div className="p-4 space-y-2 flex-grow">
              <p
                className="font-semibold text-lg text-black dark:text-white truncate"
                title={design.product.name}
              >
                {design.product.name}
              </p>
              {design.customText && (
                <p
                  className="text-sm text-gray-600 dark:text-gray-300 truncate"
                  title={design.customText}
                >
                  Text: &quot;{design.customText}&quot;
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Size: {design.size.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Saved: {new Date(design.createdAt).toLocaleDateString()}
              </p>
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
              {isEditing ? (
                <>
                  <div className="mt-2">
                    <label
                      htmlFor={`desc-${design.id}`}
                      className="block mb-1 text-xs font-medium text-zinc-400"
                    >
                      Description
                    </label>
                    <textarea
                      id={`desc-${design.id}`}
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Describe your design..."
                      className="w-full px-3 py-1.5 bg-zinc-700 border border-zinc-600 rounded-md text-white text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-zinc-500"
                    />
                  </div>
                  <div className="mt-2">
                    <label
                      htmlFor={`tags-${design.id}`}
                      className="block mb-1 text-xs font-medium text-zinc-400"
                    >
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      id={`tags-${design.id}`}
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="e.g., vintage, minimal, space"
                      className="w-full px-3 py-1.5 bg-zinc-700 border border-zinc-600 rounded-md text-white text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-zinc-500"
                    />
                  </div>
                  <div className="mt-2">
                    <Label
                      htmlFor={`usage-${design.id}`}
                      className="block mb-1 text-xs font-medium text-zinc-400"
                    >
                      Usage Rights
                    </Label>
                    <Select
                      value={editUsageRights}
                      onValueChange={setEditUsageRights}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        id={`usage-${design.id}`}
                        className="w-full text-sm bg-zinc-700 border-zinc-600 text-white focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select usage rights" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 text-white border-zinc-700">
                        <SelectItem
                          value="Personal Use Only"
                          className="text-sm focus:bg-zinc-700"
                        >
                          Personal Use Only
                        </SelectItem>
                        <SelectItem
                          value="Commercial Use Allowed"
                          className="text-sm focus:bg-zinc-700"
                        >
                          Commercial Use Allowed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  {design.description && (
                    <p
                      className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2"
                      title={design.description}
                    >
                      {design.description}
                    </p>
                  )}
                  {design.tags && design.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {design.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-200 dark:bg-zinc-600 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {design.tags.length > 4 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ...
                        </span>
                      )}
                    </div>
                  )}
                  {design.usageRights && (
                    <p
                      className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                      title="Usage Rights"
                    >
                      {design.usageRights}
                    </p>
                  )}
                </>
              )}
            </div>

            {isEditing ? (
              <div className="p-4 border-t border-zinc-700 flex justify-end space-x-2">
                <Button
                  onClick={() => setEditingDesignId(null)}
                  disabled={isSubmitting}
                >
                  <XCircle size={16} className="mr-1" /> Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700" // Keep custom class for color
                  onClick={() => {
                    // Ensure the Save button calls handleUpdateDetails
                    handleUpdateDetails(design.id, {
                      description: editDescription,
                      tags: editTags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                      usageRights: editUsageRights,
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <Save size={16} className="mr-1" /> Save Changes
                </Button>
              </div>
            ) : (
              <div className="absolute top-2 left-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => handleLoad(design)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow disabled:opacity-50"
                  aria-label="Load design"
                  title="Load design into generator"
                  disabled={isSubmitting}
                >
                  <UploadCloud size={16} />
                </Button>
                <Button
                  // Ensure the Share/Unshare button calls handleToggleShare
                  onClick={() => handleToggleShare(design.id, design.isShared)}
                  className={`${
                    design.isShared
                      ? "bg-gray-500 hover:bg-gray-600"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white p-2 rounded-full shadow disabled:opacity-50`}
                  aria-label={
                    design.isShared ? "Unshare design" : "Share design"
                  }
                  title={
                    design.isShared
                      ? "Unshare from Community"
                      : "Share to Community"
                  }
                  disabled={isSubmitting}
                >
                  {design.isShared ? (
                    <EyeOff size={16} />
                  ) : (
                    <Share2 size={16} />
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setEditingDesignId(design.id);
                    setEditDescription(design.description || "");
                    setEditTags((design.tags || []).join(", "));
                    setEditUsageRights(
                      design.usageRights || "Personal Use Only"
                    );
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full shadow disabled:opacity-50"
                  aria-label="Edit design details"
                  title="Edit description and tags"
                  disabled={isSubmitting}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  onClick={() => handleDelete(design.id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow disabled:opacity-50"
                  aria-label="Delete design"
                  title="Delete design"
                  disabled={isSubmitting}
                >
                  <Trash size={16} />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MyDesignsClient;
