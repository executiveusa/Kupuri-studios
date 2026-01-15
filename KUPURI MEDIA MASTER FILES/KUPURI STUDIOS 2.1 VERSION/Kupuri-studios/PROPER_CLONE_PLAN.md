# Kupuri Studios "Proper Prompts" Clone - Implementation Plan

## 1. Design Analysis (from Screenshots)

- **Visual Style**: High contrast, "Brutalist" but polished.
- **Typography**: Ultra-bold, condensed sans-serif headings (Impact/Oswald style). Clean serif or
  sans-serif body.
- **Colors**:
  - Primary: **Vibrant Red** (#D00000) - Used for buttons, footer background, accents.
  - Secondary: **White** (#FFFFFF) - Text, backgrounds.
  - Tertiary: **Black/Dark Grey** (#1A1A1A) - Text, backgrounds.
- **Layout Patterns**:
  - **Hero**: Centered, massive typography, 3D central figure.
  - **Sticky Scroll**: Sections appear to slide over each other or have parallax backgrounds.
  - **Grid**: Tight masonry grid for images.
  - **Footer**: Full-width red block with massive "STAY UP TO DATE" text.

## 2. Folder Structure & Asset Placeholders

We will create a dedicated directory for these assets to make replacement easy.

```
src/
  assets/
    images/
      landing/
        hero-background.jpg      (The clouds/sky)
        hero-character.png       (The 3D dragon equivalent)
        guide-feature.jpg        (The jellyfish equivalent)
        showcase/
          grid-1.jpg
          grid-2.jpg
          ...
```

## 3. Component Roadmap

### A. Global Styles & Theme

- Update `tailwind.config.js` to include the "Proper Red" and custom font families.
- Inject a Google Font (e.g., 'Oswald' or 'Anton') for the headings.

### B. `LandingHero.tsx` (The Dragon Section)

- **Layout**: Absolute positioning.
- **Layers**:
  1.  Background (Sky/Clouds) - Parallax.
  2.  Text "KUPURI STUDIOS" (Behind character?).
  3.  Character (3D Asset) - Parallax (moves faster).
  4.  Foreground Text/CTA.

### C. `LandingStickySection.tsx` (The Guide/Plant Sections)

- **Mechanism**: `position: sticky`, `top: 0`.
- **Effect**: As you scroll, the next section slides up over the previous one, or reveals from
  behind.
- **Content**: "The Gen AI Guide" equivalent -> "Kupuri AI Guide".

### D. `LandingGrid.tsx` (The Showcase)

- **Layout**: CSS Grid with varied spans.
- **Interaction**: Hover effects (scale, overlay).

### E. `LandingFooter.tsx` (The Red Section)

- **Design**: Bright Red background.
- **Content**: "STAY UP TO DATE WITH AI" in massive text.
- **Form**: Email input + "SIGN ME UP" button.

## 4. Animation Strategy (Framer Motion)

- **`useScroll`**: Drive the parallax values.
- **`AnimatePresence`**: For smooth transitions.
- **Sticky Parallax**: Use `z-index` stacking context to create the "webflow slide" effect.

## 5. Todo List

- [ ] **Step 1**: Configure Tailwind (Fonts & Colors).
- [ ] **Step 2**: Create Asset Placeholder structure.
- [ ] **Step 3**: Build `LandingHero` (Exact "Dragon" layout).
- [ ] **Step 4**: Build `LandingStickyScroll` container.
- [ ] **Step 5**: Build `LandingShowcase` (Grid).
- [ ] **Step 6**: Build `LandingFooter` (Red Block).
- [ ] **Step 7**: Assemble in `LandingPage.tsx`.
