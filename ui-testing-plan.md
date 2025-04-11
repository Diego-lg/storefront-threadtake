# UI Testing Plan for CustomizationPanel

**Date:** 2025-04-04

**Context:** This plan outlines the testing required after applying UI improvements from `generator-ui-plan.md` to the `components/generator-panel/customization-panel.tsx` component.

**Goal:** Ensure the UI changes meet the requirements, look visually correct, function as expected, and have not introduced regressions, particularly concerning the recently modified save functionality.

## Testing Scope

- **Component:** `components/generator-panel/customization-panel.tsx`
- **Environment:** Local development environment (`npm run dev`)

## Testing Activities

### 1. Visual Review

- [ ] Verify increased whitespace (padding/margins) around control groups (Tabs, Color Palette, Uploads, Sliders).
- [ ] Check if related controls are grouped more explicitly (if implemented with borders/backgrounds).
- [ ] Confirm consistent alignment and spacing across elements.
- [ ] Check if the dark theme feels modern and clean (subjective, but check against plan goals).
- [ ] Verify the tab underline is a solid purple line.
- [ ] Verify the Save button has a solid purple background.
- [ ] Ensure text colors provide good contrast and fit the minimalist feel.
- [ ] Check typography for consistency (font sizes, weights).

### 2. Functional Testing

- [ ] **Tabs (Design/Style):**
  - [ ] Clicking 'Design' tab shows text area.
  - [ ] Clicking 'Style' tab shows style controls.
  - [ ] Active tab indicator moves correctly.
- [ ] **Color Swatches:**
  - [ ] Swatches are larger (`w-10 h-10`).
  - [ ] Clicking a swatch updates the shirt color in the 3D view.
  - [ ] The selected swatch has a clear active state (border, scale, shadow).
- [ ] **Mode Toggle Button:**
  - [ ] Button text correctly shows "Switch to Pattern Mode" or "Switch to Logo Mode".
  - [ ] Clicking toggles between Logo and Pattern controls visibility.
  - [ ] Clicking toggles the `isLogoMode` state correctly (check associated controls).
- [ ] **Upload/Clear Buttons (Logo & Pattern):**
  - [ ] Clicking 'Upload' opens the file dialog.
  - [ ] Uploading a valid image applies it as a logo/pattern in the 3D view.
  - [ ] 'Clear' button appears only after upload.
  - [ ] Clicking 'Clear' removes the logo/pattern from the 3D view and hides the 'Clear' button.
  - [ ] Test for both Logo and Pattern modes.
- [ ] **Sliders (Logo Scale, Offset X, Offset Y):**
  - [ ] Sliders appear only when a logo is uploaded.
  - [ ] Sliders have increased height (`h-2`) and purple accent (`accent-purple-600`).
  - [ ] Dragging the 'Logo Scale' slider changes the logo size in the 3D view.
  - [ ] Dragging the 'Offset X' slider changes the logo horizontal position in the 3D view.
  - [ ] Dragging the 'Offset Y' slider changes the logo vertical position in the 3D view.
  - [ ] Check slider limits if applicable.
- [ ] **Text Area Input:**
  - [ ] Typing text updates the text displayed on the shirt in the 3D view (if text feature is active).
  - [ ] Placeholder text is visible when empty.
- [ ] **Save Design Button:**
  - [ ] Button is enabled only when logged in.
  - [ ] Clicking 'Save Design' triggers the save process (check console/network for API call).
  - [ ] Verify a success toast message appears on successful save.
  - [ ] Verify the correct data (including UI state like color, logo/pattern details) is sent to the backend. (Requires checking logs/network).
  - [ ] Verify the preview image is generated and sent correctly.
- [ ] **Reset Design Button:**
  - [ ] Clicking 'Reset Design' reverts all customizations (color, text, logo, pattern) to their default state.

### 3. Responsiveness Check (Optional)

- [ ] Briefly resize the browser window or use developer tools to check if the panel layout adapts reasonably without breaking.

## Testing Flow Diagram

```mermaid
graph TD
    A[Start Testing CustomizationPanel] --> B{Visual Review (Layout, Colors, Typography)};
    B -- Looks Good --> C{Functional Test: Tabs};
    B -- Issue Found --> Z(Document Issue);
    C -- Pass --> D{Functional Test: Color Swatches};
    C -- Fail --> Z;
    D -- Pass --> E{Functional Test: Mode Toggle};
    D -- Fail --> Z;
    E -- Pass --> F{Functional Test: Upload/Clear Buttons};
    E -- Fail --> Z;
    F -- Pass --> G{Functional Test: Sliders};
    F -- Fail --> Z;
    G -- Pass --> H{Functional Test: Text Area};
    G -- Fail --> Z;
    H -- Pass --> I{Functional Test: Save Button};
    H -- Fail --> Z;
    I -- Pass --> J{Functional Test: Reset Button};
    I -- Fail --> Z;
    J -- Pass --> K{Responsiveness Check};
    J -- Fail --> Z;
    K -- Pass --> L[Testing Complete];
    K -- Fail --> Z;
    Z --> L;
```

## Handoff

Upon completion of this plan, switch to **Test mode** for execution.
