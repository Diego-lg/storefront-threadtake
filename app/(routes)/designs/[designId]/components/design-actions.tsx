"use client";

import { useState } from "react"; // Import useState
import { ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button"; // Corrected to named import
import useCart from "@/hooks/use-cart";
import { Product, Size, Color } from "@/types"; // Import necessary types

// Define the structure of the design data needed by this component
// This should match the relevant parts of DesignDetails from the page component
interface CartProduct extends Product {
  designId?: string;
  designImageUrl?: string | null;
}
interface DesignDataForCart {
  id: string; // SavedDesign ID
  productId: string;
  color: Color;
  // size: Size; // Remove single size
  availableSizes: Size[]; // Add available sizes array
  designImageUrl: string | null;
  mockupImageUrl: string | null;
  product: Product; // Base product info (id, name, price, images)
}

interface DesignActionsProps {
  design: DesignDataForCart;
}

const DesignActions: React.FC<DesignActionsProps> = ({ design }) => {
  const cart = useCart();
  // State for selected size, default to first available or null
  const [selectedSize, setSelectedSize] = useState<Size | null>(
    design.availableSizes?.[0] || null
  );

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Just in case it's ever wrapped in something clickable

    const productToAdd: CartProduct = {
      ...design.product,
      color: design.color,
      size: selectedSize!, // Assert non-null as we checked above
      designId: design.id, // Include the specific SavedDesign ID
      designImageUrl: design.designImageUrl || design.mockupImageUrl, // Use best available image for cart display
    };
    // Ensure a size is selected before adding to cart
    if (!selectedSize) {
      toast.error("Please select a size.");
      return;
    }
    cart.addItem(productToAdd);
    toast.success(
      `${design.product.name} (${selectedSize.name}) added to cart.`
    );
  };

  return (
    <div className="mt-8 pt-6 border-t dark:border-zinc-700 space-y-4">
      {/* Size Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Select Size:
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* Add check to ensure availableSizes exists and is not empty before mapping */}
          {design.availableSizes && design.availableSizes.length > 0 ? (
            design.availableSizes.map((size) => (
              <Button
                key={size.id}
                variant={selectedSize?.id === size.id ? "default" : "outline"}
                onClick={() => setSelectedSize(size)}
              >
                {size.name}
              </Button>
            ))
          ) : (
            <p className="text-sm text-gray-500">No sizes available.</p> // Fallback message
          )}
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        className="w-full"
        disabled={!selectedSize} // Disable if no size is selected
      >
        <ShoppingCart size={18} className="mr-2" />
        Add to Cart
      </Button>
    </div>
  );
};

export default DesignActions;
