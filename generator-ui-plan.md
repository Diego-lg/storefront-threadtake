# Generator UI Improvement Plan

**Goal:** Refine the T-shirt generator UI to have a **minimalistic and modern** style with an overall **creative** feel.

**Date:** 2025-04-04

## 1. Layout & Spacing

- **Goal:** Create a cleaner, less cluttered interface.
- **Actions:**
  - Review layout within `CustomizationPanel`. Increase whitespace (padding/margins) around control groups using Tailwind.
  - Consider grouping related controls more explicitly (e.g., using subtle borders or backgrounds).
  - Ensure consistent alignment and spacing.

## 2. Color Palette & Theme

- **Goal:** Refine the dark theme for a modern, creative feel.
- **Actions:**
  - Keep the dark background (`bg-zinc-900`).
  - Refine accent colors (purple/blue gradients) - make more subtle or use sparingly.
  - Ensure good text contrast (`text-white`, `text-zinc-400`).
  - Update decorative background blur elements if needed.

## 3. Typography

- **Goal:** Enhance readability and modern feel.
- **Actions:**
  - Verify/use a modern sans-serif font (via `tailwind.config.ts` / `globals.css`).
  - Ensure consistent font sizes/weights using Tailwind utilities.

## 4. Control Styling (`CustomizationPanel`)

- **Goal:** Update UI controls to match the aesthetic.
- **Actions:**
  - **Tabs:** Simplify active tab indicator (solid thin line or subtle background highlight). Update `motion.div` (lines 471-479) and `motion.button` (lines 481-511).
  - **Buttons:**
    - _Primary (Save):_ Solid accent color or clean white/grey background. Style button lines 783-788.
    - _Secondary (Upload/Clear, Mode Toggle):_ Consider "ghost" buttons or subtle grey backgrounds. Update `UploadClearButtons` (lines 115-140) and Mode Toggle (lines 605-612).
    - _Color Swatches:_ Slightly larger size, clear but elegant selected state. Update mapping logic (lines 561-599).
  - **Sliders:** Restyle range inputs (`<input type="range">` lines 661-671, 684-697, 709-722) for cleaner track/thumb. Consider custom CSS or library if needed.
  - **Text Area:** Clean, minimal borders and padding (`textarea` lines 534-541).

## 5. Icons

- **Goal:** Maintain visual consistency.
- **Actions:** Continue using Lucide icons with consistent sizing/alignment.

## 6. Animations

- **Goal:** Keep interactions smooth and modern.
- **Actions:** Retain subtle Framer Motion animations.

## Affected Components

- Primarily: `components/generator-panel/customization-panel.tsx`
- Potentially: `tailwind.config.ts`, `app/globals.css`

## Visual Structure

```mermaid
graph TD
    A[DesignPage (`page.tsx`)] --> B(TShirtDesigner (`tshirt-panel.tsx`));
    B --> C{Scene (`scene.tsx`)};
    B --> D(CustomizationPanel (`customization-panel.tsx`));
    D --> E[Tabs (Design/Style)];
    D --> F[Color Swatches];
    D --> G[Upload/Clear Buttons];
    D --> H[Mode Toggle Button];
    D --> I[Sliders (Scale/Offset)];
    D --> J[Text Area];
    D --> K[Save Button];

    subgraph "UI Controls (in CustomizationPanel)"
        direction LR
        E
        F
        G
        H
        I
        J
        K
    end

    subgraph "3D View (in TShirtDesigner)"
        C
    end
```
