import React from "react";
import { ArrowRight } from "lucide-react";
import { Category } from "@/types"; // Import Category type
import Image from "next/image"; // Re-import Image
import Link from "next/link"; // Import Link for category links

interface CategorySectionProps {
  categories?: Category[]; // Expect categories prop
}

function CategorySection({ categories = [] }: CategorySectionProps) {
  // Destructure categories
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
        Shop by Category
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Map over categories */}
        {categories &&
          categories.map((category) => (
            // Use Link for the whole card
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="group relative overflow-hidden rounded-lg block" // Added block
            >
              {/* Image container */}
              {/* Use aspect-square for 1:1 ratio without plugin */}
              <div className="aspect-square relative">
                {category.billboard?.imageUrl ? ( // Check if billboard and imageUrl exist
                  <Image
                    src={category.billboard.imageUrl}
                    alt={category.name} // Use category name for alt text
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-center object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  // Optional: Placeholder if no image
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No Image</span>
                  </div>
                )}
              </div>
              {/* Overlay and Text */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-semibold text-white">
                  {category.name} {/* Display category name */}
                </h3>
                <div className="mt-2 flex items-center text-white text-sm font-medium">
                  Shop Now <ArrowRight size={16} className="ml-1" />
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}

export default CategorySection;
