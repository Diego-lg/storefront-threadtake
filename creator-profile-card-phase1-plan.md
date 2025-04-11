# Creator Profile Card - Phase 1 Plan

**Date:** 2025-04-05

**Goal:** Implement the core functionality for the creator profile card, including displaying the creator's bio. This builds the foundation for future enhancements like background customization.

## Overview

This phase focuses on adding the necessary backend support for a creator bio and integrating a reusable profile card component into the frontend.

## Tasks

### 1. Backend Changes (`eccomerce-admin` project)

- **Database Schema (`prisma/schema.prisma`):**
  - Add an optional `bio` field to the `User` model:
  ```prisma
  model User {
    // ... existing fields
    bio String?
  }
  ```
- **Database Migration:**
  - Run `npx prisma migrate dev --name add_user_bio` (or similar command based on project setup).
- **API Updates:**
  - **Profile Update Endpoint:** Modify the API endpoint responsible for updating user profile information (likely a `PATCH` or `PUT` request handled by `components/account/profile-form.tsx` in the storefront) to accept and save the `bio` field to the database.
  - **Data Fetching Endpoints:** Modify the API endpoints that return design data to include the creator's bio. This includes:
    - The endpoint for fetching single design details (used by `app/(routes)/designs/[designId]/page.tsx`, likely `GET /api/designs/:designId`). Ensure it returns `creator: { ..., bio: user.bio }`.
    - The endpoint for fetching marketplace designs (used by `app/(routes)/marketplace/components/MarketplaceDesignsClient.tsx`, likely `GET /api/marketplace/designs`). Ensure it returns `creator: { ..., bio: user.bio }`.

### 2. Frontend Changes (`treadheaven-storefront` project)

- **Profile Editing Form (`components/account/profile-form.tsx`):**
  - Add a `Textarea` component (using Shadcn UI's `Textarea`) to the form for users to input/edit their bio.
  - Update the form's submission logic (`onSubmit` handler) to include the `bio` field in the data sent to the backend profile update endpoint.
- **Data Type Interfaces:**
  - Update the `CreatorInfo` interface in `app/(routes)/designs/[designId]/page.tsx` to include `bio?: string | null;`.
  - Update the `Creator` interface in `app/(routes)/marketplace/components/MarketplaceDesignsClient.tsx` to include `bio?: string | null;`.
- **New Component (`components/creator/CreatorProfileCard.tsx`):**
  - Create this new file.
  - Implement a reusable React component using Shadcn UI components (`Card`, `Avatar`, `AvatarImage`, `AvatarFallback`, `CardHeader`, `CardContent`, `CardTitle`).
  - Define props: `interface CreatorProfileCardProps { creator: { id: string; name: string | null; image: string | null; bio?: string | null; } }`
  - Component structure:
    - Display `Avatar` with `creator.image` and fallback.
    - Display `creator.name` (e.g., in `CardTitle`).
    - Display `creator.bio` if it exists (e.g., in `CardContent`).
    - Include a `Link` component (from `next/link`) wrapping the card or part of it, pointing to `/creators/${creator.id}`.
- **Marketplace Page Update (`app/(routes)/marketplace/components/MarketplaceDesignsClient.tsx`):**
  - Locate the rendering logic for individual design cards (within the `.map` loop).
  - Next to the creator's name (`design.creator.name`), add a small `Avatar` component displaying `design.creator.image`.
  - Wrap this `Avatar` (and potentially the name) in a `Link` pointing to `/creators/${design.creator.id}`.
  - _Note: Do not use the full `CreatorProfileCard` here to keep the marketplace view concise._
- **Product Detail Page Update (`app/(routes)/designs/[designId]/page.tsx`):**
  - Import the new `CreatorProfileCard` component.
  - Locate the section currently displaying the creator's avatar and name (around lines 126-142).
  - Replace that block with `<CreatorProfileCard creator={design.creator} />`, ensuring `design.creator` is not null before rendering.
- **Styling:**
  - Ensure the new `CreatorProfileCard` has appropriate padding, margins, and styles.
  - Verify the small avatar added to the marketplace cards fits well within the existing card layout.

## Visual Plan (Mermaid)

```mermaid
graph TD
    A[User Request: Expanded Profile Card Features] --> B{Acknowledge Scope Change};
    B --> C{Propose Phased Approach};
    C --> D[Focus on Phase 1: Core Card + Bio];

    subgraph Phase 1 Implementation
        direction LR
        E[Backend: Add Bio Field] --> F[Backend: Update APIs];
        G[Frontend: Update Profile Form] --> H[Frontend: Create `CreatorProfileCard`]
        H --> I[Frontend: Update Detail Page];
        H --> J[Frontend: Update Marketplace Card (Avatar Only)];
        F & G & I & J --> K{Review & Test};
    end

    D --> E;
    D --> G;
    K --> L[Update Memory Bank];
    L --> M[Present Phase 1 Plan];

    %% Dependencies
    F --> I;
    F --> J;
    E --> F;
    G --> F;
```

## Next Steps

- Proceed with implementation, likely starting with backend changes.
- Coordinate between backend (`eccomerce-admin`) and frontend (`treadheaven-storefront`) development.
- Test thoroughly, including profile updates and display on both marketplace and detail pages.
