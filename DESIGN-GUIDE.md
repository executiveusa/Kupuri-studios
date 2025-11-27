# 🎨 Kupuri Studios - Visual Design Guide

## Design Philosophy

Inspired by **[Proper Prompts](https://www.properprompts.ai/)**, Kupuri Studios now features:
- **Large hero sections** with dramatic typography
- **Gradient text effects** for emphasis
- **Floating animated elements** for depth
- **Glassmorphism** for modern, premium feel
- **Dark, sophisticated palette** (slate-950 base)
- **Framer Motion** for smooth, performant animations

---

## Hero Section Breakdown

### **Layout Structure**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Background Glow (radial gradient, 15-20% opacity)        │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  🌟 [Kupuri Studios Beta]  ← Animated badge         │ │
│  │                                                      │ │
│  │           ¡Hola, Creador!                            │ │
│  │              Unlimited  ← Gradient text              │ │
│  │                                                      │ │
│  │  ¿Listo para convertir tus ideas en arte?           │ │
│  │                                                      │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  💬 Chat Input (glassmorphism)                 │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Floating orb 1]        [Floating orb 2]                 │
│   (purple, animated)      (blue, animated)                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### **Animation Sequence**

```typescript
// Badge: Fade in + slide up
duration: 0.6s
delay: 0s
opacity: 0 → 1
y: 20px → 0

// Title: Fade in + slide up
duration: 0.6s
delay: 0.1s
opacity: 0 → 1
y: 20px → 0

// Subtitle: Fade in + slide up
duration: 0.6s
delay: 0.2s
opacity: 0 → 1
y: 20px → 0

// Chat Input: Scale + fade in
duration: 0.6s
delay: 0.3s
opacity: 0 → 1
scale: 0.95 → 1.0

// Floating Orbs: Infinite float
purple orb: y: [0, -20, 0], duration: 6s
blue orb: y: [0, 20, 0], duration: 8s (delayed 1s)
```

---

## Color Palette

### **Base Colors**
```css
/* Background */
--bg-primary: #020617 (slate-950)
--bg-card: #0f172a (slate-900)
--bg-card-hover: #1e293b (slate-800)

/* Text */
--text-primary: #f8fafc (slate-50)
--text-secondary: #94a3b8 (slate-400)
--text-muted: #64748b (slate-500)

/* Borders */
--border-default: rgba(71, 85, 105, 0.5) (slate-700/50)
--border-hover: rgba(100, 116, 139, 0.5) (slate-600/50)
```

### **Accent Colors**
```css
/* Gradient (used on "Unlimited" text) */
gradient: linear-gradient(
  to right,
  #818cf8, /* indigo-400 */
  #c084fc, /* purple-400 */
  #f9a8d4  /* pink-400 */
)

/* Glow Effects */
--glow-purple: rgba(139, 92, 246, 0.2)
--glow-blue: rgba(59, 130, 246, 0.15)
```

### **Special Effects**
```css
/* Badge Background */
background: rgba(15, 23, 42, 0.6) /* slate-900/60 */
backdrop-filter: blur(12px)
border: 1px solid rgba(71, 85, 105, 0.5)

/* Chat Input (Glassmorphism) */
background: rgba(15, 23, 42, 0.8) /* slate-900/80 */
backdrop-filter: blur(12px)
border: 1px solid rgba(71, 85, 105, 0.5)
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5)

/* Floating Orbs */
purple: 256px × 256px, blur(48px), opacity: 0.3-0.6
blue: 384px × 384px, blur(48px), opacity: 0.2-0.5
```

---

## Typography Scale

### **Hero Title**
```css
/* Desktop (lg+) */
font-size: 8rem (128px)
line-height: 1
font-weight: 700 (bold)
letter-spacing: -0.05em (tight)

/* Mobile (base) */
font-size: 3.75rem (60px)
```

### **Gradient Text ("Unlimited")**
```css
background: linear-gradient(to-r, indigo-400, purple-400, pink-400)
-webkit-background-clip: text
-webkit-text-fill-color: transparent
background-clip: text
```

### **Subtitle**
```css
/* Desktop (lg+) */
font-size: 1.5rem (24px)
line-height: 1.5
color: slate-400

/* Mobile (base) */
font-size: 1.25rem (20px)
```

### **Badge Text**
```css
font-size: 0.75rem (12px)
font-weight: 600 (semibold)
text-transform: uppercase
letter-spacing: 0.1em (wider)
color: slate-200
```

---

## Component Specs

### **Hero Container**
```typescript
className="relative flex flex-col items-center justify-center min-h-[70vh] w-full overflow-hidden"

// Properties:
- position: relative (for absolute children)
- display: flex, flex-direction: column
- align-items: center (horizontal center)
- justify-content: center (vertical center)
- min-height: 70vh (responsive to viewport)
- width: 100%
- overflow: hidden (hides orb overflow)
```

### **Background Glow**
```typescript
className="absolute inset-0 bg-glow pointer-events-none"

// Custom utility (.bg-glow):
background: radial-gradient(
  circle at center,
  rgba(99, 102, 241, 0.15) 0%,    // indigo-500 at 15%
  rgba(139, 92, 246, 0.1) 30%,    // purple-500 at 10%
  rgba(0, 0, 0, 0) 70%            // transparent
)
```

### **Floating Orb (Purple)**
```typescript
<motion.div 
  animate={{ 
    y: [0, -20, 0],           // Float up 20px, then back
    opacity: [0.3, 0.6, 0.3], // Pulse opacity
    scale: [1, 1.1, 1]        // Slight scale
  }}
  transition={{ 
    duration: 6,              // 6 seconds per cycle
    repeat: Infinity,         // Loop forever
    ease: "easeInOut"         // Smooth easing
  }}
  className="absolute top-20 left-[15%] w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
/>
```

### **Beta Badge**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-700/50 mb-8 backdrop-blur-md"
>
  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
    Kupuri Studios Beta
  </span>
</motion.div>
```

### **Chat Input (Glassmorphism)**
```typescript
<ChatTextarea
  className="w-full shadow-2xl border-slate-700/50 bg-slate-900/80 backdrop-blur-md hover:border-slate-600/50 transition-colors"
  // ... props
/>

// CSS breakdown:
- width: 100%
- box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) (2xl)
- border: 1px solid rgba(71, 85, 105, 0.5)
- background: rgba(15, 23, 42, 0.8)
- backdrop-filter: blur(12px)
- hover:border: rgba(100, 116, 139, 0.5)
- transition: colors 150ms ease
```

---

## Responsive Breakpoints

| Breakpoint | Min Width | Hero Title | Subtitle | Orbs |
|------------|-----------|------------|----------|------|
| **sm** | 640px | 60px | 20px | Hidden |
| **md** | 768px | 96px | 22px | Visible (50% opacity) |
| **lg** | 1024px | 128px | 24px | Visible (full) |
| **xl** | 1280px | 128px | 24px | Visible (full) |

---

## CSS Utilities Reference

### **Added in `index.css`**
```css
@layer utilities {
  /* Gradient text effect */
  .text-gradient {
    @apply bg-clip-text text-transparent;
  }
  
  /* Background glow (default) */
  .bg-glow {
    background: radial-gradient(
      circle at center, 
      rgba(99, 102, 241, 0.15) 0%, 
      rgba(139, 92, 246, 0.1) 30%,
      rgba(0, 0, 0, 0) 70%
    );
  }
  
  /* Purple glow variant */
  .bg-glow-purple {
    background: radial-gradient(
      circle at center, 
      rgba(139, 92, 246, 0.2) 0%, 
      rgba(0, 0, 0, 0) 60%
    );
  }
  
  /* Blue glow variant */
  .bg-glow-blue {
    background: radial-gradient(
      circle at center, 
      rgba(59, 130, 246, 0.15) 0%, 
      rgba(0, 0, 0, 0) 60%
    );
  }
}
```

---

## Implementation Checklist

### **Hero Component** ([`Hero.tsx`](react/src/components/landing/Hero.tsx))
- [x] Accept `title`, `subtitle`, `children` props
- [x] Background glow layer
- [x] Two floating animated orbs
- [x] Beta badge with sparkle icon
- [x] Staggered fade-in animations
- [x] Gradient text on "Unlimited"
- [x] Responsive typography
- [x] Center-aligned layout

### **Home Route** ([`index.tsx`](react/src/routes/index.tsx))
- [x] Import Hero component
- [x] Wrap ChatTextarea with Hero
- [x] Apply dark theme (bg-slate-950)
- [x] Add glassmorphism to ChatTextarea
- [x] Projects list below hero
- [x] Container padding and spacing

### **Global Styles** ([`index.css`](react/src/assets/style/index.css))
- [x] Add `.text-gradient` utility
- [x] Add `.bg-glow` utility
- [x] Add `.bg-glow-purple` variant
- [x] Add `.bg-glow-blue` variant
- [x] Ensure dark theme variables

---

## Animation Performance Tips

1. **Use `transform` and `opacity` only**
   - These trigger GPU acceleration
   - Avoid animating `width`, `height`, `top`, `left`

2. **Use `will-change` sparingly**
   ```css
   .floating-orb {
     will-change: transform, opacity;
   }
   ```

3. **Reduce motion for accessibility**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

---

## Design Inspiration Sources

### **Proper Prompts** (https://www.properprompts.ai/)
- ✅ Large hero sections
- ✅ Gradient text headlines
- ✅ Dark, premium aesthetic
- ✅ Floating elements
- ✅ Glassmorphism

### **Additional Inspiration**
- Linear.app (smooth animations)
- Vercel.com (dark theme, typography)
- Stripe.com (glassmorphism, gradients)

---

## Future Enhancements

### **Phase 2 (Optional)**
- [ ] Add more floating elements (3-5 total)
- [ ] Implement particle system (stars/dust)
- [ ] Add scroll-triggered animations
- [ ] Parallax scrolling on hero
- [ ] Interactive gradient follows mouse
- [ ] 3D transforms on cards
- [ ] Video background (optional)

### **A/B Testing Ideas**
- [ ] Different gradient colors (warm vs cool)
- [ ] Badge position (top vs centered)
- [ ] Animation speed (faster vs slower)
- [ ] Orb count (2 vs 4 vs 6)

---

**Design System Version:** 1.0.0  
**Last Updated:** November 27, 2025  
**Designer:** AI Agent (following Proper Prompts principles)
