# Decision Log

This file records architectural and implementation decisions using a list format.
2025-04-04 00:15:17 - Log of updates made.

-

## Decision

-

## Rationale

-

## Implementation Details

---

**[2025-04-04 12:20:53] - Decision: Add Preview Image URL to Saved Designs**

- **Decision:** Add an optional `designImageUrl` field (String) to the `SavedDesign` model.
- **Rationale:** To store a preview image URL for each saved design, allowing users to visually identify designs and reload configurations without creating new `Product` entries per design. This maintains database storage efficiency.
- **Implementation Details:**
  - Modified `prisma/schema.prisma` in `eccomerce-admin` project.
  - Ran `prisma migrate dev`.
  - Updated `POST` and `GET` handlers in `eccomerce-admin/app/api/designs/route.ts`.
  - Requires frontend changes (image generation, Cloudinary upload, API call update, UI update) in `treadheaven-storefront`.
  - Image storage delegated to Cloudinary.

---

**[2025-04-05 00:21:16] - Decision: Implement Creator Profile Card Feature in Phases**

- **Decision:** Implement the enhanced creator profile card feature (including bio, customizable background, dynamic page background, showcase) using a phased approach due to complexity.
- **Phase 1 Focus:** Implement the core profile card with creator bio.
- **Rationale:** Deliver foundational functionality incrementally, manage complexity, and allow for iterative feedback.
- **Phase 1 Implementation Details:**
  - **Backend (`eccomerce-admin`):**
    - Add `bio: String?` to `User` model (`prisma/schema.prisma`).
    - Run `prisma migrate dev`.
    - Update profile API to handle `bio` saving.
    - Update design/marketplace APIs to return `creator.bio`.
  - **Frontend (`treadheaven-storefront`):**
    - Update `profile-form.tsx` to include Bio input.
    - Create `components/creator/CreatorProfileCard.tsx` (displays Avatar, Name, Bio, Link).
    - Update `app/(routes)/designs/[designId]/page.tsx` to use `CreatorProfileCard`.
    - Update `app/(routes)/marketplace/components/MarketplaceDesignsClient.tsx` to display creator Avatar on product cards.
    - Update relevant data type interfaces (`CreatorInfo`, `Creator`).

---

**[2025-04-05 03:13:12] - Decision: Implement Custom Design Detail Page Features**

- **Decision:** Enhance the existing `app/(routes)/designs/[designId]/page.tsx` to include product pricing and dynamic page background based on creator settings.
- **Rationale:** Fulfills the requirement for a dedicated design view, integrates creator customization, and provides essential purchasing information (price). Builds upon Phase 1 of the Creator Profile Card.
- **Implementation Details:**
  - **Backend (`eccomerce-admin`):**
    - Add `price: Decimal` to `Product` model.
    - Add `profileCardBackground: String?` to `User` model.
    - Update Admin UI for Product price and User background settings.
    - Update `GET /api/designs/[designId]` to return `product.price` and `creator.profileCardBackground`.
  - **Frontend (`treadheaven-storefront`):**
    - Update `DesignDetails` interface in `page.tsx` for `product.price`.
    - Display formatted `product.price` on the page.
    - Apply `creator.profileCardBackground` (color or image URL) as the background style to the main page container.
    - Keep existing single image display logic for now.
    - Keep "Customize this Design" as the primary CTA.
  - **Reference:** See `design-detail-page-plan.md` for detailed steps.

*
