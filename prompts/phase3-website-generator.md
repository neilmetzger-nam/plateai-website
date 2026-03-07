# PlateAI — Phase 3: Square Extension + Website Generator

## The Vision
PlateAI owns the media (photos + videos). From that media, we auto-generate
SEO-optimized restaurant websites. Content-first, not builder-first.

Owner.com sells websites and hopes restaurants fill them with content.
PlateAI generates the content first — the website builds itself around it.

---

## Part A — Square Embedded App Extension

Square allows approved apps to embed an iframe panel directly inside the
Square Dashboard item editor. When a merchant installs PlateAI from the
Square App Marketplace, a "Generate Photo" panel appears on every item.

### Extension iframe page (`app/square-extension/page.tsx`)

This page renders inside Square's iframe. It receives the item context via
postMessage from Square (item ID, name, description).

Layout (compact — fits Square's sidebar panel, ~360px wide):
- PlateAI logo (small, top)
- Item name (read from Square context)
- Style picker: 5 small cards (Enhanced, Generated, Michelin, X-Ray, Slice)
- Variations: 1–4 stepper (default 2)
- "Generate Photo" orange button
- Results: 2-col thumbnail grid, "Use This" button per image
- "Use This" → calls Square postMessage API to set item image

### Square postMessage integration
```ts
// Receive item context from Square
window.addEventListener("message", (event) => {
  if (event.data.type === "SQUARE_ITEM_CONTEXT") {
    setItem(event.data.item); // { id, name, description, categoryName }
  }
});

// Send generated image back to Square
window.parent.postMessage({
  type: "SQUARE_SET_ITEM_IMAGE",
  itemId: item.id,
  imageUrl: generatedImageUrl,
}, "*");
```

### `app/square-app/page.tsx` (Marketplace listing page)
Public landing page for Square App Marketplace:
- URL: `/square-app`
- Hero: "Professional food photos for every item in your Square catalog"
- 3 features: Auto-import catalog, One-click generation, Sync back to Square
- "Connect with Square" CTA → `/api/square/oauth/connect`
- Clean, minimal — Square reviewers will see this

---

## Part B — Restaurant Website Generator

### The concept
Once a restaurant has generated photos (via PlateAI dashboard OR Square
catalog sync), offer to build them a free SEO-optimized website in one click.

Every generated photo becomes:
- A full-page menu item with SEO title, meta description, JSON-LD schema
- Alt text auto-generated from dish name + ingredients
- Open Graph image for social sharing
- Indexed by Google with rich food photo results

### Website structure (auto-generated per restaurant)

`/sites/[slug]/` — public restaurant website

Pages auto-built from their catalog + generated media:
- `/sites/[slug]/` — Homepage: hero video (if generated), featured dishes, about
- `/sites/[slug]/menu/` — Full menu grid with all generated photos
- `/sites/[slug]/menu/[item-slug]/` — Individual item page (SEO goldmine)
- `/sites/[slug]/gallery/` — Photo + video gallery

### Homepage auto-layout
Pulled entirely from PlateAI-generated content:
1. **Hero** — best generated hero video, or top-rated photo as static hero
2. **Featured dishes** — 3–6 highest-quality generated photos (auto-selected)
3. **Menu preview** — horizontal scroll of categories
4. **About** — restaurant name, cuisine type, location (from Square merchant profile)
5. **Gallery** — all generated photos in a masonry grid

No templates to choose, no builder to learn. It just looks good automatically.

### SEO auto-generation
For every menu item page:
```ts
// Auto-generated metadata
export function generateMetadata({ params }) {
  return {
    title: `${item.name} — ${restaurant.name}`,
    description: `${item.description} at ${restaurant.name}. Order online or visit us.`,
    openGraph: {
      images: [{ url: item.plateaiImageUrl, width: 1200, height: 630 }],
    },
  };
}
```

JSON-LD schema on every item page:
```json
{
  "@context": "https://schema.org",
  "@type": "MenuItem",
  "name": "Tonkotsu Ramen",
  "description": "...",
  "image": "https://getplateai.com/...",
  "offers": { "@type": "Offer", "price": "16.00", "priceCurrency": "USD" }
}
```

Restaurant homepage JSON-LD:
```json
{
  "@type": "Restaurant",
  "name": "...",
  "image": [...all generated photos...],
  "hasMenu": { "@type": "Menu", ... }
}
```

### Data model additions to KV
```ts
// Per restaurant (keyed by userId or Square merchantId)
`restaurant:{userId}:profile` = {
  name, slug, cuisine, address, phone,
  heroVideoUrl, logoUrl,
  squareMerchantId,
}

`restaurant:{userId}:site_status` = "draft" | "live"
`restaurant:{userId}:site_url` = "getplateai.com/sites/red-bar-sushi"
```

### `/dashboard/website` page

**Preview panel** — shows a live preview of their auto-generated website.
Appears as soon as they have 3+ generated photos.

States:
1. **Locked** (< 3 photos): "Generate 3 photos to unlock your free website preview"
2. **Preview ready**: Live iframe preview of `/sites/[slug]` + "Publish →" button
3. **Live**: "Your website is live at getplateai.com/sites/[slug]" + "Share" + "View"

**"Publish" flow:**
- Confirm restaurant name + slug
- One click → sets `site_status: "live"`
- Website is immediately publicly accessible + indexable

### Upsell: Custom domain
Below the publish button:
"Connect your own domain — yourrestaurant.com → $9/mo add-on"
(just a lead capture form for now — no actual domain routing needed in Phase 3)

---

## Part C — Website Builder (light)

After publishing, let users make simple tweaks without a full builder:

`/dashboard/website/edit` — simple controls only:
- Restaurant name + tagline
- Featured dishes picker (drag to reorder)
- Hero: pick from generated videos/photos
- About text (textarea, 200 chars)
- Social links (Instagram, TikTok, Google Maps)
- Color accent (3 presets: orange, green, purple)

No drag-and-drop, no blocks, no templates. Just controls.
The site always looks great because it's built around the media.

---

## Build order
1. `app/square-extension/page.tsx` — iframe embed for Square Dashboard
2. `app/square-app/page.tsx` — marketplace landing page  
3. `app/sites/[slug]/page.tsx` — restaurant homepage
4. `app/sites/[slug]/menu/page.tsx` — menu grid
5. `app/sites/[slug]/menu/[item]/page.tsx` — item detail page with SEO
6. `app/sites/[slug]/gallery/page.tsx` — photo/video gallery
7. `/dashboard/website` — preview + publish controls
8. `/dashboard/website/edit` — simple editor

---

## Constraints
- `/sites/[slug]/*` pages are public (no auth), fully SSR for SEO
- Server components throughout for SEO pages — no "use client" on item pages
- All image alt text auto-generated (never empty)
- JSON-LD on every page
- Mobile-first — these sites must look great on phones (that's how diners browse)

---

## The pitch framing (for Square Marketplace listing)
"PlateAI generates professional photos for every item in your Square catalog —
and builds you a free SEO-optimized website from your menu automatically.
Most restaurants see Google traffic within 2 weeks of publishing."

---

## Finish
Run `pnpm build` — fix all TypeScript errors.
Do NOT deploy. Output summary of all files created/modified.
