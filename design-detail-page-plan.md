# Design Detail Page Implementation Plan

This plan outlines the steps to create a custom product detail page for individual designs, incorporating creator profile information and dynamic backgrounds.

**Phase 1: Backend Updates (`eccomerce-admin` project)**

1.  **Database Schema (`prisma/schema.prisma`):**
    - Add `price Decimal @db.Decimal(10, 2)` to the `Product` model.
    - Add `profileCardBackground String?` to the `User` model.
2.  **Database Migration:** Run `prisma migrate dev --name add_product_price_and_creator_background`.
3.  **Admin Dashboard UI:**
    - Update the Product form (create/edit) to include an input field for `price`.
    - Update the User Profile form to include an input field for `profileCardBackground` (accepting hex color codes like `#RRGGBB` or image URLs). Add validation/helper text if possible.
4.  **API Endpoint (`GET /api/designs/[designId]`):**
    - Modify the API handler to fetch and return `product.price`.
    - Modify the API handler to fetch and return `creator.profileCardBackground`. Ensure the creator relation is properly included if not already.

**Phase 2: Frontend Updates (`treadheaven-storefront` project)**

1.  **Interface Update (`app/(routes)/designs/[designId]/page.tsx`):**
    - Update the `DesignDetails` interface: Add `price: number;` (or `Decimal` type if using a library) inside the nested `product` object.
2.  **Component Logic (`app/(routes)/designs/[designId]/page.tsx`):**
    - **Display Price:**
      - Add a new element (e.g., `<p>` or `<div>`) to display the price.
      - Use `design.product.price`.
      - Format the price as currency (e.g., using `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(design.product.price)`).
      - Position it appropriately (e.g., below the product name or above the CTA).
    - **Dynamic Background:**
      - This component is likely a Server Component. Applying dynamic styles directly to `<body>` might be tricky. A possible approach is to render a client component wrapper or use inline styles on the main container (`<Container>` or its child `div`).
      - Create a helper function or logic block to determine the background style based on `design.creator.profileCardBackground`.
      - ```typescript
        let backgroundStyle = {};
        const bgValue = design.creator?.profileCardBackground;
        if (bgValue) {
          if (bgValue.startsWith("#")) {
            backgroundStyle = { backgroundColor: bgValue };
          } else if (bgValue.startsWith("http") || bgValue.startsWith("/")) {
            // Basic URL check
            backgroundStyle = {
              backgroundImage: `url(${bgValue})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            };
          }
        }
        // Apply backgroundStyle to the target element's style prop.
        // Consider adding a default background color/image if bgValue is null/invalid.
        ```
      ```
      *   Apply the resulting `backgroundStyle` object to the `style` prop of the main container div within the page component (e.g., the one with `className="px-4 py-10..."`).
      ```
    - **Verify Existing Elements:** Double-check that the design image (`displayImageUrl`), product name (`design.product.name`), description (`design.description`), `CreatorProfileCard`, and "Customize this Design" button are rendered correctly.

**Future Enhancements:**

- Image carousel for multiple design/mockup views.
- "Add to Cart" functionality (if designs become directly purchasable).
- More robust background validation (color vs. URL).
