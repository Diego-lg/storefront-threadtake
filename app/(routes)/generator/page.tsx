"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect } from "react"; // Import hooks
import getProducts from "@/actions/get-products"; // Import the action
import { Product } from "@/types"; // Import Product type
import { useDesignLoaderStore } from "@/hooks/use-design-loader"; // Import Zustand store
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { AlertCircle } from "lucide-react"; // Import icon for error alert

const TShirtDesigner = dynamic(
  () => import("@/components/generator-panel/tshirt-panel"),
  {
    ssr: false,
    // Optional: Add a loading component here if dynamic import takes time
    // loading: () => <p>Loading T-Shirt Designer Component...</p>,
  }
);

const DesignPage = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check store immediately, before async fetch
    const { loadDesignConfig } = useDesignLoaderStore.getState();

    if (loadDesignConfig) {
      console.log("DesignPage: Found design config in store, skipping fetch.");
      // Set a minimal product-like structure with the necessary IDs
      // Note: We don't have the full product details here, but TShirtDesigner only needs IDs
      setProduct({
        id: loadDesignConfig.productId,
        // Add other required fields from Product type with dummy/null values if needed
        // This depends on what TShirtDesigner *actually* uses from the product prop
        // For now, assuming only id and size.id are strictly needed by the child.
        name: "Loaded Design", // Placeholder name
        price: "0", // Placeholder
        isFeatured: false,
        isArchived: false,
        category: {
          id: "",
          name: "",
          billboard: { id: "", label: "", imageUrl: "" },
        }, // Dummy
        size: { id: loadDesignConfig.sizeId, name: "", value: "" }, // Use loaded sizeId
        color: { id: loadDesignConfig.colorId, name: "", value: "" }, // Use loaded colorId
        images: [], // No images needed from product when loading
        storeId: "", // Dummy
        categoryId: "", // Dummy
        sizeId: loadDesignConfig.sizeId,
        colorId: loadDesignConfig.colorId,
        createdAt: new Date().toISOString(), // Dummy
        updatedAt: new Date().toISOString(), // Dummy
      } as Product); // Cast to Product type, acknowledging potential missing fields
      setLoading(false);
      setError(null);
    } else {
      // If no config in store, fetch the default product
      const fetchInitialProduct = async () => {
        try {
          setLoading(true);
          setError(null);
          const products = await getProducts({});
          if (products && products.length > 0) {
            setProduct(products[0]);
          } else {
            setError("No products found to load the designer.");
          }
        } catch (err) {
          console.error("Failed to fetch initial product:", err);
          setError("Failed to load product data.");
        } finally {
          setLoading(false);
        }
      };
      fetchInitialProduct();
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // Loading State: Use Skeleton components for a better visual placeholder
  if (loading) {
    return (
      <div className="flex flex-col md:flex-row h-full max-h-full">
        {/* Skeleton for 3D View */}
        <div className="w-full md:w-[60%] lg:w-[65%] h-[60vh] md:h-full p-4">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
        {/* Skeleton for Customization Panel */}
        <div className="w-full md:w-[40%] lg:w-[35%] h-[40vh] md:h-full p-4">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Error State: Use Alert component for clear error feedback
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Designer</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Missing Product/Size ID Error State
  if (!product || !product.size?.id) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Could not load necessary product or size information. Please try
            refreshing the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render TShirtDesigner only when product and size ID are available
  // Wrap in a container that takes full height
  return (
    <div className="h-full max-h-full">
      <TShirtDesigner productId={product.id} sizeId={product.size.id} />
    </div>
  );
};

export default DesignPage;
