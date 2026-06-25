# Dark Mode Testing & Implementation Guide

## Overview

Complete dark mode implementation across all Hotel and Logistics pages using CSS variables and Tailwind's dark mode utilities. This guide provides testing procedures and implementation standards.

---

## Dark Mode Architecture

### System Preferences Detection
```jsx
// Automatic detection in layout.tsx
<html className={isDark ? 'dark' : ''}>
  {/* Browser automatically detects: prefers-color-scheme */}
</html>
```

### CSS Variable System (globals.css)

```css
@layer base {
  :root {
    /* LIGHT MODE COLORS */
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    --card: 0 0% 96.3%;
    --card-foreground: 0 0% 3.6%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.6%;
    --muted: 0 0% 89.8%;
    --muted-foreground: 0 0% 39.2%;
    --accent: 0 0% 9.0%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.6%;
    --radius: 0.5rem;
    
    /* HOTEL PRIMARY */
    --hotel-primary: 0 84.2% 60.2%;
    --hotel-primary-light: 0 90% 68%;
    --hotel-primary-dark: 0 75% 50%;
    
    /* LOGISTICS PRIMARY */
    --logistics-primary: 210 100% 50%;
    --logistics-primary-light: 210 100% 65%;
    --logistics-primary-dark: 210 100% 35%;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      /* DARK MODE COLORS */
      --background: 0 0% 9%;
      --foreground: 0 0% 98%;
      --card: 0 0% 14%;
      --card-foreground: 0 0% 98%;
      --popover: 0 0% 14%;
      --popover-foreground: 0 0% 98%;
      --muted: 0 0% 23.1%;
      --muted-foreground: 0 0% 63.9%;
      --accent: 0 0% 98%;
      --accent-foreground: 0 0% 9%;
      --destructive: 0 86.2% 60.4%;
      --destructive-foreground: 0 0% 9%;
      --border: 0 0% 23.1%;
      --input: 0 0% 23.1%;
      --ring: 0 0% 83.1%;
      
      /* HOTEL PRIMARY - LIGHTER IN DARK MODE */
      --hotel-primary: 0 91% 62%;
      --hotel-primary-light: 0 95% 75%;
      --hotel-primary-dark: 0 85% 50%;
      
      /* LOGISTICS PRIMARY - LIGHTER IN DARK MODE */
      --logistics-primary: 210 100% 55%;
      --logistics-primary-light: 210 100% 70%;
      --logistics-primary-dark: 210 100% 40%;
    }
  }
}
```

---

## Dark Mode Testing Checklist

### 1. Navigation & Headers

**Light Mode:**
- [ ] Header background clean white
- [ ] Title text dark and readable
- [ ] Icons visible in primary color (red/blue)
- [ ] Navigation buttons have good contrast

**Dark Mode:**
- [ ] Header background dark (near black)
- [ ] Title text bright white/off-white
- [ ] Icons visible and lighter shade of primary
- [ ] Navigation buttons visible on dark background
- [ ] No harsh white areas causing eye strain

### 2. KPI Cards

**Light Mode:**
- [ ] Card backgrounds are off-white (96% gray)
- [ ] Text is dark and readable
- [ ] Icons visible in accent colors
- [ ] Borders subtle but visible

**Dark Mode:**
- [ ] Card backgrounds are dark (14% gray)
- [ ] Text is white/off-white
- [ ] Icons are lighter/brighter than light mode
- [ ] Borders visible (white with 10% opacity)
- [ ] Gradient backgrounds are subtle

### 3. Tables & Data Lists

**Light Mode:**
- [ ] Header row background slightly darker than cards
- [ ] Text rows alternate subtle white/off-white
- [ ] Status badges have strong colors
- [ ] Borders visible between rows

**Dark Mode:**
- [ ] Header row background darker than data rows
- [ ] Data rows have slight background variation
- [ ] Status badges are bright/visible
- [ ] Borders subtle (white 5-10% opacity)

### 4. Modals & Dialogs

**Light Mode:**
- [ ] Modal background white or very light
- [ ] Text dark and readable
- [ ] Close button visible

**Dark Mode:**
- [ ] Modal background dark (slightly lighter than page)
- [ ] Text bright and readable
- [ ] Close button visible and easy to tap

### 5. Status Badges

**Test Pattern:**
```jsx
// Example status badge testing
const statuses = [
  { name: 'Active', class: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300' },
  { name: 'Pending', class: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
  { name: 'Error', class: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300' },
  { name: 'Info', class: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
];
```

**Light Mode:**
- [ ] Green badges: Light green background, dark green text
- [ ] Amber badges: Light amber background, dark amber text
- [ ] Red badges: Light red background, dark red text
- [ ] Blue badges: Light blue background, dark blue text

**Dark Mode:**
- [ ] Green badges: Dark green background, light green text
- [ ] Amber badges: Dark amber background, light amber text
- [ ] Red badges: Dark red background, light red text
- [ ] Blue badges: Dark blue background, light blue text
- [ ] All text readable (NOT same as background color)

### 6. Buttons

**Light Mode:**
- [ ] Primary buttons (red/blue) have good contrast
- [ ] Secondary buttons visible
- [ ] Hover states darken button
- [ ] Focus ring visible (black outline)

**Dark Mode:**
- [ ] Primary buttons bright (lighter shade)
- [ ] Secondary buttons visible on dark background
- [ ] Hover states darken button further
- [ ] Focus ring visible (white/light outline)

### 7. Input Fields

**Light Mode:**
- [ ] Input background white or light gray
- [ ] Text dark and readable
- [ ] Placeholder text lighter gray
- [ ] Focus border visible in primary color

**Dark Mode:**
- [ ] Input background dark (23% gray)
- [ ] Text bright white
- [ ] Placeholder text muted/gray
- [ ] Focus border visible in bright primary color

### 8. Charts & Graphs

**Light Mode:**
- [ ] Chart colors visible against white background
- [ ] Legend readable
- [ ] Grid lines subtle

**Dark Mode:**
- [ ] Chart colors adjusted for dark background
- [ ] Legend readable (light text)
- [ ] Grid lines subtle (light gray)
- [ ] Chart background doesn't clash with page

### 9. Images & Illustrations

**Light Mode:**
- [ ] Images display normally
- [ ] Illustrations have clean backgrounds

**Dark Mode:**
- [ ] Images don't appear washed out
- [ ] White backgrounds on illustrations blend smoothly
- [ ] Illustrations adjusted if needed (opacity, brightness)

### 10. Links & Text

**Light Mode:**
- [ ] Links are blue/primary color
- [ ] Text is dark and readable
- [ ] Links have underlines or clear distinction

**Dark Mode:**
- [ ] Links are bright (lighter blue/primary)
- [ ] Text is bright and readable
- [ ] Links visually distinct from body text
- [ ] Hover/visited states visible

---

## Hotel Vertical Dark Mode Testing

### FrontDesk Page
```
Light Mode Checklist:
  ☐ Header: Red accent "FrontDesk"
  ☐ KPI cards: Off-white backgrounds
  ☐ Check-in table: White rows
  ☐ Status badges: Green/amber/red
  ☐ Action buttons: Red primary

Dark Mode Checklist:
  ☐ Header: Lighter red accent
  ☐ KPI cards: Dark gray backgrounds
  ☐ Check-in table: Dark rows with subtle borders
  ☐ Status badges: Proper dark colors
  ☐ Action buttons: Bright red
  ☐ No text is white-on-white
  ☐ No text is black-on-black
```

### Reservations Page
```
Light Mode:
  ☐ Calendar visualization readable
  ☐ Status badges clear colors
  ☐ Modal dialogs clean white
  ☐ Table headers darker than rows

Dark Mode:
  ☐ Calendar readable on dark
  ☐ Status badges proper colors
  ☐ Modal dialogs dark but distinct
  ☐ Table contrast maintained
```

---

## Logistics Vertical Dark Mode Testing

### Shipments Page
```
Light Mode Checklist:
  ☐ Header: Blue accent "Shipments"
  ☐ KPI cards: Off-white, clear text
  ☐ Table: White rows, visible borders
  ☐ Status badges: Clear colors
  ☐ Filter buttons: Blue primary

Dark Mode Checklist:
  ☐ Header: Bright blue accent
  ☐ KPI cards: Dark gray backgrounds
  ☐ Table: Dark rows, subtle borders
  ☐ Status badges: Dark background, light text
  ☐ Filter buttons: Bright blue
  ☐ In Transit: Blue accent visible
  ☐ Delivered: Green accent visible
  ☐ Delayed: Amber accent visible
  ☐ At Risk: Red accent visible
```

### Drivers Page
```
Light Mode:
  ☐ Driver cards: Off-white backgrounds
  ☐ Rating stars: Gold/amber color
  ☐ Performance graph: Blue colors
  ☐ Status badges: Appropriate colors

Dark Mode:
  ☐ Driver cards: Dark backgrounds
  ☐ Rating stars: Bright amber
  ☐ Performance graph: Bright blue
  ☐ Status badges: Dark with light text
```

---

## Dark Mode Color Reference

### Hotel Colors (Red Theme)

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary Button | red-600 | red-400 |
| Primary Text | red-700 | red-300 |
| Status Active | green-700 | green-300 |
| Status Warning | amber-700 | amber-300 |
| Status Error | red-700 | red-300 |
| Card Bg | white (off) | slate-900 (14%) |
| Card Border | red-200/50 | red-800/30 |

### Logistics Colors (Blue Theme)

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary Button | blue-600 | blue-400 |
| Primary Text | blue-700 | blue-300 |
| Status Optimal | emerald-700 | emerald-300 |
| Status Warning | amber-700 | amber-300 |
| Status Critical | red-700 | red-300 |
| Card Bg | white (off) | slate-900 (14%) |
| Card Border | blue-200/50 | blue-800/30 |

---

## Browser Dark Mode Testing

### Chrome/Edge/Firefox
```bash
1. Open DevTools (F12)
2. Click Three dots menu → More tools → Rendering
3. Under "Emulate CSS media feature prefers-color-scheme" select:
   - "prefers-color-scheme: light" (Test light mode)
   - "prefers-color-scheme: dark" (Test dark mode)
4. Page should change colors instantly
```

### macOS System Dark Mode
```bash
1. System Preferences → General → Appearance
2. Select "Dark"
3. Refresh browser
4. Verify website switches to dark mode
```

### Windows System Dark Mode
```bash
1. Settings → Personalization → Colors
2. Select "Dark" mode
3. Refresh browser
4. Verify website switches to dark mode
```

### Mobile (iOS)
```bash
1. Settings → Display & Brightness → Dark
2. Or set to "Automatic" for time-based switching
3. Open browser and refresh
4. Verify dark mode appearance
```

### Mobile (Android)
```bash
1. Settings → Display → Dark theme
2. Toggle on
3. Open browser and refresh
4. Verify dark mode appearance
```

---

## Common Dark Mode Issues & Fixes

### Issue: Text not readable
```jsx
// WRONG
<p className="text-white">Text</p>  // Only visible in dark mode

// CORRECT
<p className="text-foreground">Text</p>  // Works in both modes
```

### Issue: White backgrounds in dark mode
```jsx
// WRONG
<div className="bg-white">Content</div>

// CORRECT
<div className="bg-card dark:bg-slate-900">Content</div>
```

### Issue: Hard borders in dark mode
```jsx
// WRONG
<div className="border-2 border-black">

// CORRECT
<div className="border border-black/10 dark:border-white/10">
```

### Issue: Charts hard to read
```jsx
// WRONG - Same chart in both modes
<Chart data={data} />

// CORRECT - Adjust for dark mode
<Chart
  data={data}
  theme={isDarkMode ? 'dark' : 'light'}
/>
```

### Issue: Images look washed out
```jsx
// WRONG
<img src="/image.png" />

// CORRECT - Adjust in dark mode
<img
  src="/image.png"
  className="dark:opacity-90 dark:brightness-110"
/>
```

---

## Dark Mode Implementation Standards

### Every Page Must Have:
- [ ] Semantic color tokens (not hardcoded colors)
- [ ] Dark mode CSS variables defined
- [ ] Tested in both light and dark modes
- [ ] Proper contrast ratio (WCAG AA minimum)
- [ ] No white-on-white or black-on-black
- [ ] Status badges visible in both modes
- [ ] Links distinguishable in both modes

### Component Checklist:
- [ ] HotelPageWrapper - Works in both modes
- [ ] HotelKPICard - Colors adjust automatically
- [ ] LogisticsPageWrapper - Ocean blue theme works
- [ ] LogisticsKPICard - Status colors visible
- [ ] BentoCard - Background/text readable
- [ ] Tables - Rows distinguishable
- [ ] Modals - Visible and readable
- [ ] Buttons - Visible and functional
- [ ] Badges - All status types visible
- [ ] Icons - Visible in both modes

---

## Performance Notes

Dark mode switching should be:
- Instant (no flashing)
- Smooth (optional transition)
- No page reload needed
- Respects system preference

```css
/* Optional: Add smooth transition when switching */
html, html * {
  transition: background-color 0.3s, color 0.3s;
}
```

---

## Testing Priority

### Must Test (Critical)
1. All pages render (no errors)
2. Text readable in both modes
3. Status badges visible
4. No hardcoded colors
5. Tables/lists show data

### Should Test (Important)
1. Links distinguishable
2. Buttons functional
3. Modals visible
4. Charts readable
5. Images not washed out

### Nice to Test (Polish)
1. Animations smooth
2. Hover states work
3. Focus states visible
4. Print mode (optional)
5. Different browsers

---

## Deployment Checklist

Before deploying Phase 5:
- [ ] All pages tested in light mode
- [ ] All pages tested in dark mode
- [ ] Mobile (375px) responsive
- [ ] Tablet (768px) responsive
- [ ] Desktop (1024px) responsive
- [ ] No console errors
- [ ] No accessibility warnings
- [ ] Lighthouse score > 80
- [ ] Dark mode toggle works
- [ ] All links functional
