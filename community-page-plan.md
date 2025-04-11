# Marketplace Page Enhancement Plan

This plan outlines features to enhance the marketplace page for user-generated designs, broken down into phases. It assumes the page displays designs marked as `isShared`.

## Phase 1: Foundational Improvements & Core Engagement

- **Goal:** Enhance basic discoverability and presentation, enable simple filtering, and lay the groundwork for marketplace interaction.
- **Key Features:**
  - Display Creator Username on Design Listings.
  - Display Design Description.
  - Implement Basic Search (by description/tags).
  - Implement Basic Filtering (by tags).
  - Implement Basic Sorting (Newest, Popularity - based on Views).
  - Display View Count.
  - Add Simple Social Sharing Buttons.
  - Allow Creators to add Descriptions and Tags during saving.
- **Backend Tasks:**
  - Add `description: String?`, `tags: String[]`, `viewCount: Int @default(0)` fields to `SavedDesign` model (Prisma).
  - Update/Create API endpoint to fetch _shared_ designs (`isShared: true`), including new fields and basic creator info (username). (e.g., `/api/marketplace/designs`)
  - Update API endpoint for saving/updating designs to accept `description` and `tags`. (e.g., `POST/PATCH /api/designs`)
  - Implement API logic/endpoint to increment `viewCount` when a shared design is viewed.
  - Run database migrations.
- **Frontend Tasks:**
  - **Crucial First Step:** Locate or create the specific route and component file(s) for the public marketplace page. (e.g., `/marketplace`)
  - Adapt/Create the marketplace page component to fetch shared designs from the updated API.
  - Modify the design listing card UI:
    - Display creator username.
    - Display `description` (e.g., truncated with "read more" or on hover).
    - Display `viewCount`.
  - Implement UI elements for Search, Filter (by tags), and Sort (Newest, Views).
  - Integrate social sharing buttons (linking to a potential future design detail page or the main marketplace page).
  - Update the design generator's save process UI to include input fields for `description` and `tags`.

## Phase 2: Richer Listings & Deeper Interaction

- **Goal:** Improve visual appeal, build trust through ratings, and enhance creator visibility.
- **Key Features:**
  - Display Designs on Product Mockups.
  - Implement Rating & Review System.
  - Link to Creator Profile Pages.
  - Add Filtering by Rating.
  - (Optional) Implement Commenting/Discussion Threads.
- **Backend Tasks:**
  - Add `averageRating: Float @default(0)`, `ratingCount: Int @default(0)` fields to `SavedDesign`.
  - Create `Rating` model (fields: `id`, `score`, `comment?`, `createdAt`, linked to `SavedDesign` and `User`).
  - Create API endpoints for submitting ratings (requires user authentication) and fetching ratings for a design.
  - Update API endpoint for fetching shared designs to include rating info.
  - (Mockups) If server-generated: Add `mockupImageUrl: String?` to `SavedDesign`, integrate image processing, update save logic.
  - (Creator Profiles) Add relevant fields (bio, avatar, etc.) to `User` model if not present. Create API endpoint to fetch profile data.
- **Frontend Tasks:**
  - **Product Mockups:** Update design listing card to prioritize `mockupImageUrl` over `designImageUrl`. Implement mockup generation/upload if needed.
  - **Rating & Review System:**
    - Display average rating (e.g., stars) on design cards.
    - Create UI for submitting ratings/reviews (likely on a design detail page).
    - Display list of reviews on a design detail page.
  - **Creator Info:** Make creator username on card a link to their profile page (requires creating the profile page route/component).
  - Add "Rating" to filter/sort options.
  - (Optional) Implement commenting UI on design detail pages.

## Phase 3: Monetization & Growth Strategies

- **Goal:** Introduce direct sales incentives, advanced features, and marketplace growth drivers.
- **Key Features:**
  - Implement Creator Revenue Share / Affiliate Program.
  - Display Usage Rights / Licensing Information.
  - Implement Design Bundling Options.
  - Run Design Contests.
  - Add Trending / Featured Sections.
  - Implement User Collections / Wishlists.
- **Backend Tasks:**
  - **Revenue Share:** Significant effort. Requires tracking sales origins, calculating earnings, potentially new models/tables, integration with orders/payments.
  - Add `usageRights: String` (or Enum) field to `SavedDesign`. Update APIs.
  - **Bundling:** Define bundle structure (new model?), update product/cart APIs.
  - **Contests:** Models for Contests, Submissions, potentially Voting. APIs to manage contests and submissions.
  - **Collections/Wishlists:** New models linking Users and Designs. APIs to manage collections.
- **Frontend Tasks:**
  - Display `usageRights` on design listings/detail pages.
  - Implement UI for viewing/purchasing Bundles.
  - Create UI for Design Contests (browsing, submitting, viewing winners).
  - Create **Creator Dashboard** section (in `/account`?) to show stats and earnings.
  - Implement **Featured/Trending Sections** on the marketplace page (requires fetching curated/algorithmic lists from backend).
  - Implement UI for adding/viewing **Collections/Wishlists**.
