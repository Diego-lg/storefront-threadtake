# Generator Improvement Plan: Phase 1 - Core Save/Load & E-commerce Flow

**Date:** 2025-04-04

**Goal:** Enable users to reliably save their detailed design configurations (shirt color, logo/pattern choice and file, logo placement/scale) and load them back into the generator accurately. This is crucial for e-commerce functionality like reloading saved designs and fulfilling orders based on the exact configuration.

**Key Assumption:** Saving the full design configuration details (not just a preview image) is necessary for the intended e-commerce functionality.

---

## Tasks:

1.  **Backend Modifications (`eccomerce-admin` project):**

    - **Schema Update:** Modify `prisma/schema.prisma`. Add the following fields (or similar) to the `SavedDesign` model:
      - `shirtColorHex: String?`
      - `isLogoMode: Boolean?` (True if logo, False if pattern)
      - `logoScale: Float?`
      - `logoOffsetX: Float?`
      - `logoOffsetY: Float?`
      - `logoTargetPart: String?` (e.g., "front", "back")
      - `logoFileUrl: String?` (URL of the uploaded/selected logo file)
      - `patternFileUrl: String?` (URL of the uploaded/selected pattern file)
    - **API Update (`app/api/designs/route.ts`):**
      - Modify the `POST` handler to accept these new fields in the request body and save them to the database along with `designImageUrl`.
      - Modify the `GET` handler (or relevant fetch mechanism used by the frontend) to retrieve and return these fields when fetching saved designs.

2.  **Frontend - Saving Logic (`components/generator-panel/customization-panel.tsx`):**

    - **Enhance `handleSaveDesign` function:**
      - Gather all necessary state values representing the current design configuration (e.g., `shirtColor`, `isLogoMode`, `logoScale`, `logoOffset`, `logoTargetPart`, `logoFileToUpload`, `patternFileToUpload`, existing `uploadedLogoUrl`, existing `uploadedPatternUrl`). These might need to be passed down as props or accessed via context/store.
      - **Conditional File Upload:** Before calling the save API, check if `logoFileToUpload` or `patternFileToUpload` contains a new `File` object. If yes, upload that file to persistent storage (e.g., Cloudinary) and obtain the persistent URL.
      - **API Payload Construction:** Create the data object for the `POST /api/designs` request, including:
        - `designImageUrl` (the preview image data URL).
        - `shirtColorHex`.
        - `isLogoMode`.
        - `logoScale`, `logoOffsetX`, `logoOffsetY`, `logoTargetPart` (conditional on `isLogoMode`).
        - `logoFileUrl` (URL from upload, existing URL, or null).
        - `patternFileUrl` (URL from upload, existing URL, or null).
      - Send this complete payload to the backend API.

3.  **Frontend - Loading Logic (`components/generator-panel/tshirt-panel.tsx`):**

    - **Enhance `useEffect` hook for `useDesignLoaderStore`:**
      - When `loadDesignConfig` (containing the full saved configuration fetched from the backend) is present:
        - Set component state: `shirtColor`, `isLogoMode`, `logoScale`, `logoOffset`, `logoTargetPart`.
        - **Load Textures:** Use `THREE.TextureLoader` to load textures from `loadDesignConfig.logoFileUrl` or `loadDesignConfig.patternFileUrl`. Update `uploadedLogoTexture`/`uploadedPatternTexture` and `uploadedLogoUrl`/`uploadedPatternUrl` states on success. Clear corresponding `FileToUpload` states.
        - Ensure correct texture properties (wrap, flipY) are set after loading.
        - Clear the `loadDesignConfig` from the Zustand store.

4.  **Frontend - UI Refinements (Optional but Recommended):**
    - Clarify button actions in `CustomizationPanel` (e.g., "Save Design").
    - Display base product info (`productId`, `sizeId`) for context.

---

## Mermaid Diagram (Phase 1 Flow)

```mermaid
graph TD
    subgraph User Flow (Save/Load)
        A[Generator Page Load] --> B{Load Saved Design?};
        B -- Yes --> C[Fetch Full Config from Backend API];
        C --> D[Update Zustand Store with Full Config];
        B -- No --> E[Load Default Product];
        D --> F[TShirtDesigner Init with Full Config];
        E --> G[TShirtDesigner Init with Defaults];
        F --> H{Customize};
        G --> H;
        H --> M{Save Design?};
        M -- Yes --> N[Gather Full Config State (Color, Mode, Scale, Offset, Files)];
        N --> O{New Logo/Pattern File?};
        O -- Yes --> P[Upload File to Storage -> Get URL];
        O -- No --> Q[Use Existing URL or Null];
        P --> R[Construct Full Payload (Config + Preview Image URL)];
        Q --> R;
        R --> S[POST Full Payload to Backend API];
        S --> T[Show Confirmation];
    end

    subgraph Components
        GenPage[app/.../generator/page.tsx] --> TDPanel[TShirtDesigner];
        TDPanel --> Scene[Scene];
        TDPanel --> CustPanel[CustomizationPanel];
        CustPanel -- Triggers Save --> TDPanel;
        TDPanel -- Updates Props --> Scene;
        TDPanel -- Reads/Writes --> Zustand[useDesignLoaderStore];
        CustPanel -- Reads/Writes --> TDPanel;
    end

    subgraph Backend
        API[/api/designs (POST/GET)]
        DB[(Database: SavedDesign + New Fields)]
        Storage[(File Storage: Cloudinary?)]
    end

    S --> API;
    API --> DB;
    C --> API;
    P --> Storage;


    style GenPage fill:#f9f,stroke:#333,stroke-width:2px
    style TDPanel fill:#f9f,stroke:#333,stroke-width:2px
    style CustPanel fill:#f9f,stroke:#333,stroke-width:2px
    style Scene fill:#ccf,stroke:#333,stroke-width:2px
    style Zustand fill:#ff9,stroke:#333,stroke-width:2px
    style API fill:#9cf,stroke:#333,stroke-width:2px
    style DB fill:#9cf,stroke:#333,stroke-width:2px
    style Storage fill:#9cf,stroke:#333,stroke-width:2px
```
