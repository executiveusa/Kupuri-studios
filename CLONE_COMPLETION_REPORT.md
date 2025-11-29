# Kupuri Studios "Proper Prompts" Clone - Completion Report

## 🎯 Mission Accomplished

We have successfully transformed the frontend into a pixel-perfect clone of the Proper Prompts
aesthetic, adapted for Kupuri Studios.

## 📂 Asset Replacement Guide

We have created a centralized asset file at: `src/components/landing/proper-prompts/assets.ts`

You simply need to replace the URL strings in this file with your local or hosted image paths.

### 1. Hero Section (The Dragon)

- **Background**: `PROPER_ASSETS.hero.background`
  - _Requirement_: High-resolution sky/cloud image.
  - _Recommended Size_: 1920x1080px (Landscape)
- **Character**: `PROPER_ASSETS.hero.character`
  - _Requirement_: A 3D character (Dragon/Mascot) with a **transparent background** (PNG/WebP).
  - _Recommended Size_: 1000x1000px or higher.

### 2. Sticky Sections (The Guide)

- **Feature Image**: `PROPER_ASSETS.guide.feature`
  - _Requirement_: An artistic, vertical-oriented image (like the jellyfish).
  - _Recommended Size_: 800x1000px (Portrait)

### 3. Showcase Grid (The Collection)

- **Grid Images**: `PROPER_ASSETS.showcase` (Array of 5 URLs)
  - _Requirement_: A mix of landscape and portrait AI generations.
  - _Recommended Size_: 800px width minimum.

## 🛠 Features Implemented

1.  **Parallax Hero**: The "Dragon" character floats independently of the "KUPURI STUDIOS" text and
    background sky.
2.  **Sticky Scroll Reveal**: The "Gen AI Guide" and "Magic Canvas" sections slide over each other
    using sticky positioning, mimicking the Webflow motion effect.
3.  **Tight Masonry Grid**: The showcase grid uses exact span classes (`col-span-2`, `row-span-2`)
    to create the dense, high-energy layout.
4.  **Interactive Hover**: Images go from grayscale to color on hover, with a "Copy Prompt" overlay.
5.  **Brutalist Footer**: The massive red footer with the "STAY UP TO DATE" typography is
    implemented.

## 🚀 Next Steps

1.  **Add Your Images**: Open `assets.ts` and paste your links.
2.  **Run the App**: `npm run dev` to see the magic.
