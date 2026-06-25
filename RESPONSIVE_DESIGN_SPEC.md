# Phase 5: Responsive Design & Dark Mode Specification

## Overview

All components in the enhanced UI (Hotel & Logistics) must be fully responsive across all breakpoints and support seamless dark mode. This document provides the complete specification for testing and implementation.

---

## Responsive Breakpoints

### Tailwind Breakpoints (Used Throughout)
```
sm: 640px   (Mobile)
md: 768px   (Tablet)
lg: 1024px  (Desktop)
xl: 1280px  (Large Desktop)
2xl: 1536px (Extra Large)
```

### Standard Layout Pattern
```jsx
<BentoGrid columns={{ sm: 1, md: 2, lg: 4 }} gap={4}>
  {/* Items automatically reflow */}
</BentoGrid>
```

---

## Mobile-First Design Rules

### 1. **KPI Card Grid Layout**
```jsx
// Mobile (1 column)
<BentoGrid columns={{ sm: 1 }}>

// Tablet (2 columns)
columns={{ sm: 1, md: 2 }}

// Desktop (4 columns)
columns={{ sm: 1, md: 2, lg: 4 }}
```

✅ CORRECT: Starts at 1 column, expands to 2 at tablet, 4 at desktop
❌ WRONG: Starting with multi-column layouts that break on mobile

### 2. **Header/Navigation**
- Mobile: Stack vertically, full width
- Tablet: Horizontal with icons + text
- Desktop: Full horizontal with actions on right

```jsx
<div className="flex flex-col md:flex-row items-center justify-between gap-4">
  {/* Content */}
</div>
```

### 3. **Sidebar/Panel Layouts**
- Mobile: Single column, no sidebar
- Tablet: Stacked or collapsed sidebar
- Desktop: Fixed/sticky sidebar with content

```jsx
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-1/3">
  <main className="w-full lg:w-2/3">
</div>
```

### 4. **Table/List Responsiveness**
- Mobile: Stack all columns or use card view
- Tablet: Show essential columns
- Desktop: Full table with all columns

```jsx
<div className="overflow-x-auto">
  <table className="w-full">
    <tr>
      <td className="hidden md:table-cell">Extra Column</td>
    </tr>
  </table>
</div>
```

---

## Mobile Optimization Checklist

### Navigation & Header
- [ ] Header text is readable on small screens (no overflow)
- [ ] Buttons are touch-friendly (min 44x44px)
- [ ] Navigation doesn't take >30% of screen
- [ ] Back button or hamburger menu visible on mobile

### Content Areas
- [ ] Main content has horizontal scroll for tables, not page scroll
- [ ] Images scale to viewport width
- [ ] Text is readable (16px+ for body text)
- [ ] Line length is <75 characters (readability)

### Forms & Inputs
- [ ] Input fields are full width on mobile
- [ ] Buttons are full width or stacked
- [ ] Touch targets are 48x48px minimum
- [ ] Labels are above inputs on mobile

### Bottom Actions
- [ ] Floating action buttons don't overlap content
- [ ] Save/Submit buttons are prominent
- [ ] Cancel/Back options visible but secondary

---

## Tablet Optimization (768px - 1023px)

### Layout Changes
- Increase padding slightly (16px -> 24px)
- 2-column grid layouts become standard
- Sidebar collapses to icons only or expandable
- Main content takes more breathing room

### Key Rules
- KPI cards: 2 columns (4 cards in 2x2 grid)
- Tables: Show most important columns
- Modals: Increase width to 80% of screen
- Dialogs: Center and increase width appropriately

```jsx
<BentoGrid columns={{ sm: 1, md: 2, lg: 4 }}>
  {/* 2 columns on tablet, 4 on desktop */}
</BentoGrid>
```

---

## Desktop Optimization (1024px+)

### Full-Featured Layout
- Multi-column layouts fully visible
- Sidebars fixed/sticky
- Tables show all columns with horizontal scroll
- Modals can be smaller (60-70% width)
- KPI cards in full 4-column grid

---

## Spacing Responsive Pattern

### Standard Responsive Spacing
```jsx
// Padding
className="px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8"

// Gap
className="gap-4 md:gap-6 lg:gap-8"

// Margin
className="mb-4 md:mb-6 lg:mb-8"
```

### Grid Gaps
```jsx
<BentoGrid gap={3} md:gap={4} lg:gap={6}>
```

---

## Typography Responsive Pattern

### Heading Sizes (Hotel)
```jsx
// Main page title
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">

// Section headers
<h2 className="text-lg md:text-xl lg:text-2xl font-semibold">

// Card titles
<h3 className="text-base md:text-lg font-semibold">

// Body text
<p className="text-sm md:text-base">
```

### Heading Sizes (Logistics)
- Same pattern but slightly smaller on mobile
- Ensure text doesn't wrap awkwardly
- Use `text-balance` for 3+ word titles

---

## Dark Mode Complete Specification

### 1. CSS Variable System

All colors are defined as CSS variables in `globals.css`:

```css
:root {
  /* Light mode */
  --background: 0 0% 100%;
  --foreground: 0 0% 3%;
  --card: 0 0% 96%;
  --muted: 0 0% 89%;
  --primary: 0 86% 51%;      /* Hotel Red */
  --secondary: 210 67% 44%;  /* Logistics Blue */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode */
    --background: 0 0% 9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 15%;
    --muted: 0 0% 24%;
    --primary: 0 91% 62%;     /* Lighter Red */
    --secondary: 210 85% 55%; /* Lighter Blue */
  }
}
```

### 2. Component Dark Mode Pattern

```jsx
// CORRECT: Using semantic tokens
<div className="bg-background text-foreground">
  <div className="bg-card text-card-foreground">
    {/* Automatically adjusts in dark mode */}
  </div>
</div>

// CORRECT: Using Tailwind dark prefix
<div className="bg-white dark:bg-slate-950 text-black dark:text-white">

// WRONG: Hardcoded colors
<div className="bg-white text-black">
  {/* Won't change in dark mode */}
</div>
```

### 3. Dark Mode Colors

#### Hotel Vertical (Red Theme)
```
Light: red-600, red-500, red-400
Dark: red-400, red-300, red-200

Accent:
Light: amber-100, amber-50
Dark: amber-950, amber-900
```

#### Logistics Vertical (Blue Theme)
```
Light: blue-600, blue-500, blue-400
Dark: blue-400, blue-300, blue-200

Accent:
Light: cyan-100, cyan-50
Dark: cyan-950, cyan-900
```

### 4. Dark Mode Badges & Status Colors

```jsx
// Status badge pattern
<span className={`${
  status === 'active'
    ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300'
    : 'bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
}`}>
  {status}
</span>
```

### 5. Dark Mode Text Contrast

**Required contrast ratios (WCAG AA):**
- Normal text: 4.5:1
- Large text (18px+): 3:1

```jsx
// Ensure sufficient contrast
<p className="text-foreground">          {/* Sufficient contrast */}
<p className="text-muted-foreground">    {/* Secondary text, still readable */}
<p className="text-muted">               {/* Tertiary, lowest contrast */}
```

### 6. Dark Mode Images

```jsx
// For images that need adjusting in dark mode
<img
  className="dark:opacity-90 dark:brightness-110"
  src="/image.png"
  alt="Description"
/>

// For diagrams/charts with white backgrounds
<div className="bg-white dark:bg-slate-900">
  <ChartComponent />
</div>
```

### 7. Dark Mode Borders

```jsx
// Border pattern (subtle in dark mode)
<div className="border border-black/10 dark:border-white/10">
  
// Card borders
<div className="border border-black/5 dark:border-white/5">

// Header separator
<div className="border-b border-black/10 dark:border-white/10">
```

---

## Testing Dark Mode

### Manual Testing Checklist
- [ ] Toggle dark mode in browser dev tools
- [ ] All text is readable in both modes
- [ ] All icons are visible (not black on black, white on white)
- [ ] Buttons have visible focus states
- [ ] Charts/graphs render correctly
- [ ] Images don't wash out or become too dark
- [ ] Borders are visible in both modes
- [ ] Hover states work in both modes
- [ ] Status badges are color-coded correctly
- [ ] Links are distinguishable from body text

### Automated Testing
```css
/* In globals.css, verify these transitions */
color-scheme: light dark;
transition: background-color 0.3s, color 0.3s;
```

---

## Testing Responsive Design

### Mobile Testing (375px - 480px width)
```bash
# Chrome DevTools
1. Toggle device toolbar (Ctrl+Shift+M)
2. Set device to iPhone SE (375x667)
3. Verify:
  - All text readable
  - No horizontal scroll
  - Buttons clickable (44x44px+)
  - Images scale appropriately
  - Tables have horizontal scroll
  - Modals full width with padding
```

### Tablet Testing (768px - 1024px)
```bash
# Chrome DevTools - iPad (768x1024)
1. Verify 2-column layouts work
2. Sidebar collapses or becomes icons
3. Padding balanced (not too compressed)
4. Touch targets remain > 44x44px
5. Horizontal scroll handled gracefully
```

### Desktop Testing (1024px+)
```bash
# Full browser window at 1920x1080+
1. Verify 4-column KPI grids
2. Sidebars properly positioned
3. Maximum content width reasonable (~1400px)
4. Hover effects working
5. Enough whitespace around content
```

### Orientation Testing
```bash
# Mobile landscape (480x360 typical)
1. Verify content still readable
2. Navigation doesn't push content down
3. Key actions still accessible
4. Images scale appropriately

# Tablet landscape (1024x768)
1. Verify full features visible
2. Sidebars fixed or accessible
3. Full-width modals adjusted
```

---

## Responsive Component Patterns

### 1. Page Wrapper Responsive
```jsx
<div className="px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
  {/* Content has responsive padding */}
</div>
```

### 2. Card Grid Responsive
```jsx
<BentoGrid
  columns={{
    sm: 1,    // Mobile
    md: 2,    // Tablet
    lg: 3,    // Desktop
    xl: 4     // Large screens
  }}
  gap={4}
  className="gap-4 md:gap-6 lg:gap-8"
>
  {items.map((item, idx) => (
    <BentoGridItem key={item.id} delay={idx * 0.05}>
      <BentoCard>{/* Content */}</BentoCard>
    </BentoGridItem>
  ))}
</BentoGrid>
```

### 3. Split Layout Responsive
```jsx
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-1/3 xl:w-1/4">
    {/* Sidebar on mobile */}
  </aside>
  <main className="w-full lg:w-2/3 xl:w-3/4">
    {/* Main content takes 2/3 on large screens */}
  </main>
</div>
```

### 4. Table Responsive
```jsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[800px]">
    <thead>
      <tr>
        <th className="hidden sm:table-cell">Mobile hidden</th>
        <th className="hidden md:table-cell">Tablet hidden</th>
        <th>Always visible</th>
      </tr>
    </thead>
  </table>
</div>
```

---

## Performance Optimization for Responsive

### Viewport Meta Tag (layout.tsx)
```jsx
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

### Image Optimization
```jsx
import Image from 'next/image';

<Image
  src="/image.png"
  alt="Description"
  width={1200}
  height={600}
  responsive
  priority={false}
/>
```

### Media Query Performance
```css
/* Use CSS Media Queries, not JavaScript */
@media (max-width: 768px) {
  .sidebar { display: none; }
}

/* Avoid */
if (window.innerWidth < 768) { /* Bad */ }
```

---

## Accessibility + Responsive

### Focus States (All Sizes)
```jsx
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background"
```

### Touch-Friendly Targets (Mobile)
```jsx
// Minimum 44x44px for touch
className="p-3 md:p-2"  /* 48px on mobile, 40px on desktop */
```

### Text Zoom (All Sizes)
```jsx
/* Support up to 200% zoom */
/* Don't use fixed heights, allow content to flex */
className="min-h-[44px]"  /* Instead of h-[44px] */
```

---

## Responsive Design Checklist

### Before Committing
- [ ] Mobile (375px): All content visible, no overflow
- [ ] Mobile (480px): Comfortable to read and tap
- [ ] Tablet (768px): 2-column layouts work
- [ ] Desktop (1024px): 4-column layouts work
- [ ] Desktop (1920px): Content centered, width reasonable
- [ ] Dark mode: All text readable, no color issues
- [ ] Keyboard: Tab through all interactive elements
- [ ] Touch: All buttons > 44x44px
- [ ] Images: Scale properly at all sizes
- [ ] Print: Looks reasonable (optional but nice)

---

## Common Mistakes to Avoid

❌ Fixed width containers
✅ Use max-w-screen, Flex, or Grid

❌ Hardcoded pixel sizes for fonts
✅ Use relative sizes (rem, em, text-scale)

❌ Dark mode using `dark:` on every element
✅ Use semantic tokens (bg-card, text-foreground)

❌ Tables that don't scroll on mobile
✅ Wrap in overflow-x-auto

❌ Modals that don't close on mobile
✅ Full screen on mobile, centered on desktop

❌ Forgetting viewport meta tag
✅ Include in layout.tsx

---

## Next Steps (Phase 6)

After responsive & dark mode are complete:
1. Performance optimization (Lighthouse scores)
2. Animation refinement
3. Browser compatibility
4. Final visual polish
5. Deployment readiness
