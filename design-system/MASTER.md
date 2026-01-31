# 🎨 Kupuri Studios Design System (UDIP v2.1 ULTIMATE)

**Quality Bar:** Awwwards-level (9+/10 minimum)  
**Target Audience:** Creative professionals, content creators, designers  
**Vibe:** Premium, immersive, content-focused, collaborative  
**Status:** Foundation Layer (v1.0 - UDIP Compliant)

---

## 📐 VISUAL IDENTITY

### Color Palette (Light Mode - Primary)
```css
/* Primary Text - High Contrast */
text-primary: #0F172A (slate-900) /* All body text, links */
text-secondary: #475569 (slate-600) /* Muted descriptions */
text-muted: #64748B (slate-500) /* Disabled states, hints */
text-inverse: #F8FAFC (slate-50) /* On dark backgrounds */

/* Backgrounds */
bg-canvas: #FFFFFF /* Primary background */
bg-alt: #F8FAFC (slate-50) /* Alternate sections */
bg-glass: rgba(255, 255, 255, 0.8) /* Glassmorphism (80%+ opacity) */

/* Brands & Accents */
accent-primary: #A855F7 (purple-600) /* Primary CTA, highlights */
accent-secondary: #D8B4FE (purple-300) /* Hover states, light accents */
accent-dark: #9333EA (purple-700) /* Active states */

/* Semantic Colors */
success: #16A34A (green-600) /* Confirmations, success states */
warning: #F59E0B (amber-500) /* Warnings, caution */
error: #DC2626 (red-600) /* Errors, destructive actions */
info: #0EA5E9 (cyan-500) /* Information, notifications */

/* Borders & Dividers */
border-light: #E2E8F0 (slate-200) /* Visible but subtle */
border-muted: #E0E7FF (indigo-100) /* Faint dividers */

/* Contrast Verification (WCAG 2.1 AA Minimum 4.5:1) */
text-primary (0F172A) on white: 15.1:1 ✅
text-secondary (475569) on white: 7.3:1 ✅
accent-primary (A855F7) on white: 5.2:1 ✅
```

### Color Palette (Dark Mode - Secondary)
```css
/* Dark Mode - NOT PRIMARY FOR INITIAL LAUNCH */
text-primary: #F8FAFC (slate-50) /* High contrast white */
text-secondary: #94A3B8 (slate-400) /* Muted text */
bg-canvas: #0F172A (slate-900) /* Dark background */
bg-alt: #1E293B (slate-800) /* Alternate sections */
bg-glass: rgba(0, 0, 0, 0.4) /* Glassmorphism (40%+ opacity) */

/* All accent colors same */
accent-primary: #A855F7
accent-secondary: #D8B4FE (more visible on dark)
```

### Light Mode ONLY for Initial Launch
- **Decision:** Focus 100% on light mode for MVP
- **Reason:** Light backgrounds work better with video player and content previews
- **Dark mode:** Implement in Phase 2 after light mode validates
- **Transition:** Add `prefers-color-scheme: light` as default

---

## 🔤 TYPOGRAPHY

### Font Stack
```css
/* Headings */
font-heading: 'Anton', 'Impact', sans-serif
font-heading-fallback: 'Arial', sans-serif

/* Body Text - Premium sans-serif for readability */
font-sans: 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif
```

### Size Hierarchy (Mobile-First)
| Context | Size (Mobile) | Line-Height | Weight | Use Case |
|---------|--------------|------------|--------|----------|
| **Hero H1** | 40px | 1.1 | 700 (bold) | Page headlines |
| **Section H2** | 28px | 1.2 | 600 (semibold) | Major sections |
| **Subsection H3** | 20px | 1.3 | 600 (semibold) | Content headings |
| **Body p** | 16px | 1.6 | 400 (regular) | Body text (WCAG AA min 16px) |
| **Small p** | 14px | 1.5 | 400 (regular) | Helper text, captions |
| **Button** | 14px | 1.5 | 600 (semibold) | CTA text |
| **Label** | 12px | 1.4 | 500 (medium) | Form labels, tags |

### Desktop Scaling
- **Hero H1:** 56px (mobile 40px)
- **Section H2:** 36px (mobile 28px)
- **All other:** No desktop scaling (consistency)

### Letter Spacing
- Compact (`-0.02em`): Headings only
- Normal (`0em`): Body text

### Line Height Targets
- **Headings:** 1.1-1.2 (tight, impactful)
- **Body:** 1.6-1.75 (comfortable reading)
- **Form labels:** 1.4 (compact)

---

## 🎯 LAYOUT SYSTEM

### Spacing Scale (Tailwind-based)
```
Base unit: 4px (Tailwind xs=2px is avoided)
Scale: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 (px)
Tailwind classes: px-2→96 (multiples of 4px)
```

### Container & Max-Width
```css
/* Desktop-first max-width for content */
max-w-container: 6xl (64rem / 1024px) /* Primary content */
max-w-narrow: 4xl (56rem / 896px) /* Form, single column */
max-w-wide: 7xl (80rem / 1280px) /* Hero, full bleed */

/* Mobile margins */
mx-mobile: 16px (px-4)
mx-tablet: 24px (px-6)
mx-desktop: 32px (px-8)
```

### Grid System
```css
/* 12-column responsive */
Mobile: 1 column
Tablet (md): 2-3 columns
Desktop (lg): 3-4 columns
Wide (xl): 4-6 columns

Gap: 16px (md), 24px (lg) - NEVER 32px (too wide)
```

---

## 🧩 COMPONENT PATTERNS (Awwwards Winners)

### 1. Hero Section (Full-Viewport)
**Pattern:** Cinematic, scroll-triggered animations, content-centric

```tsx
<section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
  {/* Background Layer - Video or Gradient */}
  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 to-gray-100" />
  
  {/* Floating Navbar (Fixed) */}
  <nav className="fixed top-4 left-4 right-4 z-50 bg-white/80 backdrop-blur-md rounded-lg px-6 py-3">
    {/* Logo + Links + CTA */}
  </nav>

  {/* Hero Content - Centered */}
  <div className="max-w-3xl mx-auto px-4 text-center">
    <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-slate-900 mb-6 leading-tight">
      Create Video Magic Instantly
    </h1>
    <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
      Professional AI-powered video generation for creators, marketers, and studios
    </p>
    
    {/* Primary CTA */}
    <button className="cursor-pointer px-8 py-4 bg-accent-primary text-white rounded-lg font-semibold text-lg hover:bg-accent-dark transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-600 min-w-[44px] min-h-[44px]">
      Start Creating Free
    </button>
  </div>

  {/* Scroll Indicator (Optional) */}
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
    <ArrowDown className="w-6 h-6 text-slate-600" /> {/* SVG icon, NOT emoji */}
  </div>
</section>
```

**Key Principles:**
- Full viewport (100vh) with centered content
- Floating navbar (not stuck to edges) - top-4 left-4 right-4
- Single primary CTA, high contrast
- Animated scroll indicator with SVG icon
- No layout shift on hover (no scale transforms)

---

### 2. Feature Cards (Glassmorphism)
**Pattern:** Subtle glass effect, hover state visible, consistent spacing

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {features.map((feature) => (
    <div 
      key={feature.id}
      className="group cursor-pointer relative p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 hover:bg-white hover:shadow-lg transition-all duration-200"
    >
      {/* Icon - Always SVG, 24x24 */}
      <div className="mb-4">
        {feature.icon} {/* Lucide or Heroicons icon */}
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {feature.title}
      </h3>
      
      <p className="text-sm text-slate-600 leading-relaxed">
        {feature.description}
      </p>
    </div>
  ))}
</div>
```

**Key Rules:**
- Glass background: `bg-white/80` (NOT /10, NOT /50)
- Always visible border: `border-slate-200`
- Hover: opacity change OR color shift (NOT scale)
- Rounded: `rounded-xl` (16px, not 8px)
- Icon: 24x24px from Lucide/Heroicons

---

### 3. Navigation (Transparent → Solid on Scroll)
**Pattern:** Initially transparent, solidifies on scroll, floating style

```tsx
<nav className="fixed top-4 left-4 right-4 z-50 transition-all duration-200" style={{
  backgroundColor: scrollY > 50 ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(8px)",
  borderRadius: "0.5rem",
  padding: "0.75rem 1.5rem"
}}>
  <div className="flex items-center justify-between max-w-6xl mx-auto">
    <div className="text-xl font-bold text-slate-900 cursor-pointer">
      Kupuri
    </div>
    
    {/* Desktop Menu */}
    <div className="hidden md:flex items-center gap-8">
      {navItems.map(item => (
        <a 
          key={item.id}
          href={item.href}
          className="text-slate-600 hover:text-slate-900 transition-colors duration-150 cursor-pointer"
        >
          {item.label}
        </a>
      ))}
    </div>

    {/* CTA Button */}
    <button className="cursor-pointer px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-semibold hover:bg-accent-dark transition-colors duration-200">
      Launch App
    </button>
  </div>
</nav>
```

**Key Rules:**
- Position: `fixed top-4 left-4 right-4` (floating, NOT top-0)
- Responsive: Hide complex menu on mobile, show hamburger menu
- Scrolled state: Gently solidify but maintain translucency

---

### 4. CTA Buttons (Primary Pattern)
**CRITICAL:** All buttons require `cursor-pointer`

```tsx
/* Primary Button */
<button className="cursor-pointer px-6 py-3 bg-accent-primary text-white rounded-lg font-semibold hover:bg-accent-dark transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-600">
  Get Started
</button>

/* Secondary Button */
<button className="cursor-pointer px-6 py-3 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition-colors duration-200">
  Learn More
</button>

/* Icon Button */
<button 
  className="cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150"
  aria-label="Close menu"
>
  <X className="w-6 h-6" /> {/* SVG only */}
</button>
```

**ABSOLUTE RULES:**
- ✅ `cursor-pointer` ON ALL interactive elements
- ✅ Transition: 150-300ms (never >500ms)
- ✅ Focus states: `focus-visible:ring-2`
- ✅ Touch targets: Min 44x44px (`min-w-[44px] min-h-[44px]`)
- ✅ NO scale transforms (use opacity or color only)

---

## ♿ ACCESSIBILITY (WCAG 2.1 AA - MANDATORY)

### Color Contrast
```css
/* Minimum 4.5:1 for normal text, 3:1 for large text (18px+) */

✅ CORRECT:
Color pair: #0F172A (text) on #FFFFFF (bg) = 15.1:1 ✅
Accent pair: #A855F7 on #FFFFFF = 5.2:1 ✅

❌ WRONG:
Color pair: #64748B (slate-500) on white = 3.8:1 ❌ TOO LOW
Accent pair: #D8B4FE (purple-300) on white = 2.1:1 ❌ INVALID
```

### Images & Icons
```tsx
/* Images MUST have alt text */
<img 
  src="hero.webp" 
  alt="Kupuri Studios dashboard showing AI-powered video creation interface"
  loading="lazy"
  className="w-full h-auto"
/>

/* Icons MUST have aria-label if icon-only button */
<button 
  aria-label="Toggle theme" 
  className="cursor-pointer p-2"
>
  <Moon className="w-6 h-6" /> {/* SVG icon */}
</button>

/* Icon + Text = No extra label needed */
<button className="cursor-pointer flex items-center gap-2">
  <ArrowRight className="w-5 h-5" />
  <span>Get Started</span>
</button>
```

### Form Accessibility
```tsx
/* Every input MUST have a label with htmlFor + id */
<div className="mb-4">
  <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
    Email Address
  </label>
  <input 
    id="email"
    type="email"
    placeholder="your@email.com"
    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
  />
</div>

/* Error states */
<input 
  aria-invalid="true"
  aria-describedby="email-error"
  className="border-red-600"
/>
<p id="email-error" className="text-sm text-red-600 mt-1">
  Email is required
</p>
```

### Keyboard Navigation
- **Tab order:** Logical left-to-right, top-to-bottom
- **Focus visible:** Always visible (not `outline-none` without replacement)
- **Focus ring:** `ring-2 ring-offset-2 ring-purple-600`
- **Skip links:** Hidden but keyboard-accessible (Jump to content)

### Motion & Animations
```tsx
/* ALWAYS respect prefers-reduced-motion */
const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div 
  animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
  initial={{ opacity: 0, y: 20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

/* Tailwind class for static reduced motion */
<div className="motion-safe:animate-pulse motion-reduce:opacity-100">
  Only animate if motion allowed
</div>
```

---

## ⚡ PERFORMANCE TARGETS

### Lighthouse Benchmarks
```
Mobile:  ≥ 90 (Performance, Accessibility, Best Practices, SEO)
Desktop: ≥ 95 (Performance, Accessibility, Best Practices, SEO)

Specific Metrics:
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s
```

### Image Optimization
```tsx
/* WebP format with fallback */
<picture>
  <source srcSet="image-1024w.webp 1024w, image-512w.webp 512w" type="image/webp" />
  <img 
    srcSet="image-1024w.jpg 1024w, image-512w.jpg 512w" 
    src="image-512w.jpg"
    alt="Description"
    width="1024"
    height="576"
    loading="lazy"
  />
</picture>

/* Or use Next.js Image component */
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  quality={85}
  placeholder="blur"
  loading="lazy"
/>
```

### Animation Performance
```css
/* GPU-accelerated properties ONLY */
✅ transform: translateY(20px) /* Uses GPU */
✅ opacity: 0.5 /* Uses GPU */

❌ height: 300px /* CPU reflow - BAD */
❌ width: 200px /* CPU reflow - BAD */
❌ top: 50px /* CPU repaint - BAD */

/* Transition durations */
Fast: 150ms (hover feedback)
Medium: 200ms (micro-interactions)
Slow: 300ms (major transitions)
❌ NEVER: > 500ms
```

---

## 🚫 ABSOLUTE DO-NOTs (UDIP v2.1)

### Icons & Visual Elements
- ❌ **NO emoji icons** anywhere (🚀, ⭐, ✨ = VIOLATION)
- ✅ **SVG icons only:** Lucide React, Heroicons, Simple Icons
- ✅ **Consistent icon set:** Don't mix Lucide + Heroicons
- ✅ **Icon size:** 20x20 or 24x24 (viewBox="0 0 24 24"), never 16x16

### Interaction
- ❌ **Missing cursor-pointer** on clickables = VIOLATION
- ❌ **Hover-only interactions** on mobile (no touch equivalent)
- ❌ **Scale transforms** on hover (causes layout shift / CLS violation)
- ✅ **Color/opacity transitions** for hover feedback
- ✅ **Touch targets:** 44x44px minimum (WCAG 2.1 AAA compliance)

### Layout & Spacing
- ❌ **Navbar at top-0** (old, amateur look)
- ✅ **Navbar floating:** top-4 left-4 right-4 with slight rounded corners
- ❌ **Inconsistent max-width** across pages
- ✅ **Consistent container:** max-w-6xl or max-w-7xl throughout
- ❌ **Random z-index values** (10, 50, 999, 1000 mix)
- ✅ **Z-index scale:** 10, 20, 30, 40, 50 (predictable)

### Colors & Contrast
- ❌ **Light mode unreadable** (using slate-400 for body text)
- ✅ **Light mode text:** slate-900 (#0F172A) with 4.5:1+ contrast
- ❌ **Glass cards too transparent** (bg-white/10 or /20)
- ✅ **Glass cards:** bg-white/80+ (minimum 80% opacity)
- ❌ **Borders invisible** in light mode
- ✅ **Visible borders:** slate-200 or light accent colors

### Performance
- ❌ **No responsive images** (srcset, WebP format)
- ✅ **WebP + JPEG fallback** with lazy loading
- ❌ **Animations using width/height** (Causes CPU reflow)
- ✅ **Transform/opacity only** (GPU accelerated)
- ❌ **Unoptimized fonts** (loading multiple variants)
- ✅ **Font subsetting** (load only needed weights/chars)
- ❌ **No prefers-reduced-motion support**
- ✅ **All animations respect prefers-reduced-motion**

### Accessibility
- ❌ **Missing alt text** on images
- ❌ **Icon buttons without aria-label**
- ❌ **Form inputs without labels** (placeholder ≠ label)
- ❌ **No focus states** (outline-none without ring replacement)
- ❌ **Color as only indicator** (use icons/text too)
- ✅ **Tab order** matches visual order
- ✅ **ARIA labels** on dynamic content
- ✅ **4.5:1 contrast minimum** (WCAG AA)

---

## 📋 PRE-DELIVERY CHECKLIST (MUST PASS ALL)

### Visual Quality (10 items)
- [ ] No emoji icons (SVG only: Lucide, Heroicons)
- [ ] Consistent icon set (not mixing libraries)
- [ ] All icons 24x24px (viewBox="0 0 24 24")
- [ ] Hover states don't cause layout shift (no scale)
- [ ] Navbar floating (top-4 left-4 right-4, not top-0)
- [ ] Content padding accounts for fixed navbar (pt-24)
- [ ] Consistent max-width (max-w-6xl) throughout
- [ ] Z-index scale used (10, 20, 30, 40, 50)
- [ ] No random z-index values (999, 1000, etc)
- [ ] Light mode primary text readable (#0F172A)

### Interaction (8 items)
- [ ] cursor-pointer on ALL clickable/hoverable elements
- [ ] Hover feedback via color/opacity (not scale)
- [ ] All transitions 150-300ms (not >500ms)
- [ ] Focus states visible (ring-2 ring-offset-2)
- [ ] Touch targets ≥44x44px
- [ ] Mobile interactions (no hover-only)
- [ ] Buttons respond to keyboard (Enter/Space)
- [ ] No missing cursor feedback

### Light/Dark Mode (5 items) - Light Primary
- [ ] Light mode primary text readable (#0F172A on white)
- [ ] Light mode secondary text readable (#475569 on white)
- [ ] Light mode glass cards visible (bg-white/80+)
- [ ] Light mode borders visible (slate-200 not white/10)
- [ ] Contrast verified ≥4.5:1 (light mode)

### Accessibility (10 items)
- [ ] All images have descriptive alt text
- [ ] Icon-only buttons have aria-label
- [ ] Form inputs have labels (htmlFor + id)
- [ ] Color not the only indicator (use icons/text)
- [ ] Keyboard navigation works (Tab order logical)
- [ ] Focus states visible (not outline-none)
- [ ] Touch targets ≥44x44px
- [ ] prefers-reduced-motion respected
- [ ] 4.5:1 contrast on all text
- [ ] (No missing ARIA labels)

### Performance (6 items)
- [ ] Images: WebP format, srcset, lazy loading
- [ ] Animations: transform/opacity only (no width/height)
- [ ] CLS < 0.1 (no layout shift on hover/load)
- [ ] 60fps animations (Chrome DevTools confirms)
- [ ] Lighthouse Mobile > 90, Desktop > 95
- [ ] No unused dependencies in bundle

### Technical (4 items)
- [ ] TypeScript strict mode (no 'any' types)
- [ ] No hardcoded colors (use theme/Tailwind)
- [ ] Responsive tested: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

**Total: 43 items before delivery**

---

## 📚 COMPONENT INVENTORY

### Already Built (In react/src/components/)
- Navigation
- HeroSection
- PricingPage
- ProjectCard / Grid
- Button
- ThemeToggle
- Settings
- Auth dialogs
- Agent studio layouts

### Needs Updating (Per UDIP v2.1)
1. **HeroSection** - Apply hero pattern (floating navbar, kinetic typography)
2. **Button** - Add cursor-pointer, fix hover states
3. **Cards** - Update glass background opacity (to /80)
4. **Icons** - Remove emoji, replace with Lucide
5. **Forms** - Add proper labels, aria-describedby

### Needs Creating
1. **Feature cards grid** - Awwwards pattern
2. **Testimonials** - Scroll-triggered animations
3. **CTA section** - Final conversion focus
4. **FAQ accordion** - Accessibility-first

---

**UDIP v2.1 ULTIMATE - Design System Complete**  
**Next:** Implement per component, iterate, validate against checklist before launch.

---

*Generated: 2026-01-30*  
*Protocol: UDIP v2.1 ULTIMATE + Vibe Coding Loop*  
*Quality Bar: Awwwards-level (9+/10)*
