# Kupuri Studios: Implementation Plan for Claude Sonnet 4.5

## 1. Visual & Brand Overhaul (The "Apple" Polish)

### A. Landing Page (`react/src/components/landing/proper-prompts/`)

- [ ] **Hero Section**:
  - Replace "Proper Prompts" / "Jaaz" branding with **Kupuri Studios**.
  - Update copy to reflect "The Infinite Canvas" and "Generative AI Studio" positioning.
  - Ensure the "Start Creating Free" button links correctly to `/canvas/new`.
- [ ] **Navbar**:
  - Fix broken links. Ensure "Enter Studio" goes to `/canvas/new`.
  - Add links to "Library" (`/assets`) and "Knowledge" (`/knowledge`) if appropriate for public
    view, or hide them behind auth.
- [ ] **Showcase Section**:
  - Replace placeholder images with high-quality generative art examples.
  - Add Framer Motion scroll animations for a premium feel.

### B. The "Real Studio" Experience (`react/src/routes/canvas.$id.tsx`)

- [ ] **Empty State**:
  - Create a `CanvasEmptyState` component.
  - Instead of a blank white screen, show a "Starter Guide" or "Pick a Template" overlay.
  - Add quick actions: "New Chat", "Generate Image", "Browse Templates".
- [ ] **Canvas UI**:
  - Style the `CanvasHeader` to match the Kupuri brand (clean, minimal, dark mode default?).
  - Ensure the `ChatInterface` sidebar integrates seamlessly (resizable, collapsible).

### C. Navigation & Routing (`react/src/components/TopMenu.tsx`)

- [ ] **Unified Navigation**:
  - Ensure `TopMenu` is consistent across all app pages (`/canvas`, `/assets`, `/knowledge`).
  - Fix the "Back" button logic to be intuitive.
  - Highlight the active route.

## 2. Functional Wiring

### A. Chat Interface (`react/src/components/chat/Chat.tsx`)

- [ ] **Connection Stability**:
  - Verify WebSocket reconnection logic.
  - Add a visual indicator for connection status (green dot / red warning).
- [ ] **Tool Integration**:
  - Ensure "Magic Generate" and other tools trigger correctly.
  - Test the "Tool Confirmation" flow (e.g., when the AI wants to run code or generate an image).

### B. Agent Studio (`react/src/components/agent_studio/AgentStudio.tsx`)

- [ ] **Feature Activation**:
  - The current `AgentStudio` is a basic React Flow prototype.
  - **Goal**: Connect it to the backend to actually _create_ and _save_ agents.
  - Add a "Deploy Agent" button.

### C. Assets Library (`react/src/routes/assets.tsx`)

- [ ] **Gallery View**:
  - Ensure uploaded/generated images appear here.
  - Add filtering/sorting by date or type.
  - Implement "Drag to Canvas" functionality if possible.

## 3. Mobile Optimization

- [ ] **Responsive Layouts**:
  - `CanvasExcali`: Ensure touch gestures work for panning/zooming.
  - `ChatInterface`: On mobile, it should probably be a drawer or a separate tab, not a side panel.
- [ ] **Touch Targets**:
  - Increase button sizes for mobile users.

## 4. Technical Debt & Cleanup

- [ ] **Remove "Jaaz" References**:
  - Global search and replace "Jaaz" with "Kupuri" in UI text (i18n files).
- [ ] **Performance**:
  - Optimize large assets (images).
  - Code splitting for heavy components (Excalidraw, React Flow).

## 5. Execution Strategy for Claude Sonnet 4.5

1.  **Start with the Landing Page**: It's the front door. Nail the branding and links first.
2.  **Fix the "Enter Studio" Flow**: Ensure the transition from Landing -> Canvas is smooth and
    guided.
3.  **Polish the Canvas**: This is the core product. Make it feel like a pro tool.
4.  **Wire up the "Extras"**: Assets, Knowledge, Agent Studio.
