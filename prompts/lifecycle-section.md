# PlateAI — Image Lifecycle Section + Before/After Gallery Update

## Overview
Two updates to app/page.tsx:
1. Replace the single wonton soup before/after with a full multi-dish before/after gallery
2. Add a new "The Content Lifecycle" section showing the full journey from photo → video → social → ads

---

## Part 1: Before/After Gallery

Replace the existing before/after section (the one with wonton-before.png and wonton-after.webp) with a full gallery component.

### Gallery data (hardcode these pairs):
```typescript
const BEFORE_AFTER_PAIRS = [
  {
    dish: "Wonton Soup",
    restaurant: "Red Bar Sushi",
    cuisine: "Thai / Japanese",
    mode: "Enhanced",
    before: "/before-after/wonton-before.png",
    after: "/before-after/wonton-after.webp",
  },
  {
    dish: "Tonkotsu Ramen",
    restaurant: "Red Bar Sushi",
    cuisine: "Japanese",
    mode: "Enhanced",
    before: "/before-after/tonkotsu-ramen-before.png",
    after: "/before-after/tonkotsu-ramen-after.webp",
  },
  {
    dish: "Ka Praw",
    restaurant: "Best Thai Kitchen",
    cuisine: "Thai",
    mode: "Enhanced",
    before: "/before-after/ka-praw-before.png",
    after: "/before-after/ka-praw-after-v2.webp",
  },
  {
    dish: "Miso Soup",
    restaurant: "Red Bar Sushi",
    cuisine: "Japanese",
    mode: "Lifestyle Scene",
    before: "/before-after/miso-soup-before.png",
    after: "/before-after/miso-soup-lifestyle-after.webp",
  },
  {
    dish: "Salmon Carpaccio",
    restaurant: "Red Bar Sushi",
    cuisine: "Japanese",
    mode: "Michelin",
    before: "/before-after/salmon-carpaccio-before.png",
    after: "/before-after/salmon-carpaccio-after.webp",
  },
  {
    dish: "Gyoza Soup",
    restaurant: "Red Bar Sushi",
    cuisine: "Japanese",
    mode: "Enhanced",
    before: "/before-after/gyoza-soup-before.png",
    after: "/before-after/gyoza-soup-after-v2.webp",
  },
];
```

### Layout:
- Section heading: "Already have photos? We make them extraordinary."
- Subtext: "Real restaurants. Real dishes. No photographers."
- Tab row at top: show restaurant filter tabs — "All" | "Red Bar Sushi" | "Best Thai Kitchen"
  - Clicking a tab filters the visible pairs
  - Active tab: orange underline
- Grid: 2 columns on desktop, 1 on mobile
- Each card:
  - Side-by-side before/after images (equal width, 50/50)
  - Divider line in center with "VS" badge
  - Bottom bar: dish name (bold white) + restaurant name (zinc-400) + mode badge (orange pill)
  - Hover effect: slight scale up on the after image

---

## Part 2: Content Lifecycle Section

Add a new section AFTER the before/after gallery and BEFORE the video reel section.

### Section heading: "From one photo to a full content library"
### Subtext: "Every dish you generate becomes a complete content asset — ready for your menu, your social, and your ads."

### Layout: Horizontal stepped flow (on desktop), vertical stack (mobile)

Show 4 steps connected by animated arrow/line:

**Step 1 — 📸 The Photo**
- Label: "Menu & Delivery"
- Shows: a food photo thumbnail (use wagyu-ribeye-1.webp)
- Caption: "Enhanced or AI-generated. DoorDash, UberEats, website."
- Badge: "Starter · $49/mo"

**Step 2 — 🎬 The Hero Video**  
- Label: "Website & Reels"
- Shows: a dark placeholder with play button icon + "8 seconds" label
  - Use actual video if available: /videos/pork-ribs-on-grill.mp4 (autoplay muted loop, small)
- Caption: "Your best photo, animated. Steam, motion, drama."
- Badge: "Pro · $99/mo"

**Step 3 — 📱 Social Clips**
- Label: "TikTok · Instagram · Stories"
- Shows: 3 small phone-shaped frames side by side (CSS, no images needed)
  - Each frame labeled: "TikTok 15s" / "Reel 30s" / "Story 9:16"
  - Dark screen with orange play icon inside each
- Caption: "Platform-optimized cuts. Vertical. Ready to post."
- Badge: "Pro · $99/mo"

**Step 4 — 📺 Ad Creative**
- Label: "Facebook · Google · YouTube"
- Shows: 3 small ad-sized rectangles (CSS mockups):
  - 16:9 rectangle labeled "YouTube Pre-roll"
  - Square labeled "Facebook Ad"  
  - Tall rectangle labeled "Google Display"
- Caption: "Ad-ready assets with copy. Just set your budget and launch."
- Badge: "Studio · $199/mo"

### Connecting arrows between steps:
- Desktop: horizontal arrows between cards → →  →
- Each arrow pulses with a subtle orange animation (CSS keyframe, opacity 0.4 → 1 → 0.4)

### CTA below the flow:
"Start with a photo. We'll handle the rest."
Button: "Generate My First Photo →" (opens intake form)

---

## Copy assets needed
All before/after images are already in public/before-after/ — just reference them.
The /videos/ folder already has the video files.

---

## Style
Match existing: zinc-950 bg, zinc-900 cards, orange-500 accent, white text.

---

## Build & verify
pnpm build — fix any TypeScript errors.
Do NOT deploy.

When finished run:
openclaw system event --text "Done: PlateAI lifecycle section + before/after gallery built" --mode now
