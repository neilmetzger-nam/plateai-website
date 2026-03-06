# PlateAI — Generation Wizard

## Overview
Build a multi-step generation wizard at `/generate` on the PlateAI site (~/Desktop/plateai).
Tally/typeform-style: one step at a time, full screen, progress bar, keyboard nav.
Dark theme matching the existing site (zinc-950 background, orange-500 accent).

---

## Route
Create `app/generate/page.tsx` — client component.

---

## 8 Steps

### Step 1 — Dish Name
- Question: "What dish are we photographing?"
- Subtext: "Enter the name exactly as it appears on your menu."
- Input: text field
- Placeholder: "e.g. Wonton Soup"

### Step 2 — Existing Photo
- Question: "Do you have an existing photo of this dish?"
- Subtext: "We can enhance your real photo, or generate from scratch."
- Type: two large option cards (not a file input yet)
  - Card A: "Yes, I have a photo" → subtitle: "We'll enhance it"
  - Card B: "No, start from scratch" → subtitle: "We'll generate from description"
- Auto-advance on selection
- If "Yes" selected: show a drag-and-drop file upload area on the SAME step (below the cards, slides in)
  - Accept: image/png, image/jpeg, image/webp, max 20MB
  - Show preview thumbnail when uploaded
  - "Continue" button appears after upload

### Step 3 — Menu Description
- Question: "Where can we find your menu description?"
- Subtext: "We use this to make sure every ingredient is accurate — nothing added, nothing missing."
- Type: two option cards
  - Card A: "I'll paste it" → show textarea below
  - Card B: "Here's a link" → show URL input below (DoorDash, UberEats, website, etc.)
- Placeholder for textarea: "e.g. Clear broth, house-made wontons filled with chicken and pork, bean sprouts, carrots, scallions, cilantro"
- Placeholder for URL: "https://www.doordash.com/store/your-restaurant/..."
- "Continue" button

### Step 4 — Confirm Ingredients
- Question: "Confirm your ingredients"
- Subtext: "We pulled these from your description. Add or remove anything before we generate."
- Pre-populate a tag list from the description text entered in step 3
  - Parse comma-separated or natural language into individual ingredient tags
  - Each tag has an X to remove it
  - "+ Add ingredient" button opens a small text input
- Show a yellow warning banner: "⚠️ Our AI will only include ingredients shown here. Nothing will be added or removed."
- "Looks good, continue →" button

### Step 5 — Photo Style
- Question: "Choose your photo style"
- Subtext: "Each style tells a different story."
- Type: 5 style cards in a 2-col grid (last one full width)
  - **Enhanced** — "Your real photo, artistically perfected. Colors deepened, lighting improved, background cleaned." Badge: "Starter+"
  - **Generated** — "Full AI creation from your ingredient list. Accurate, photorealistic, platform-ready." Badge: "Starter+"
  - **Michelin** — "Same ingredients, plated like a fine-dining masterpiece. Architectural, precise, aspirational." Badge: "Pro+"
  - **X-Ray / Transparent** — "3D cutaway view showing every layer inside the dish. Stunning for soups, curries, ramen." Badge: "Pro+"
  - **The Slice** — "A wedge removed to reveal the interior cross-section. Viral on social media." Badge: "Pro+"
- Each card has a short visual description area (colored placeholder box representing the style)
- Auto-advance on selection

### Step 6 — Platform Destinations
- Question: "Where will you use these photos?"
- Subtext: "We'll export the right size and ratio for each platform automatically."
- Type: checkbox cards (multi-select), show all checked by default
  - DoorDash — 1400×800px · 16:9
  - UberEats — 1200×900px · 4:3
  - Grubhub — 1024×768px · 4:3
  - Google — 1024×1024px · 1:1
  - Website / Menu — 1920×1080px · 16:9
  - Instagram / Social — 1080×1080px · 1:1
  - Print Menu — 3000×2000px · 3:2
- "Continue →" button

### Step 7 — Resolution
- Question: "What resolution do you need?"
- Subtext: "Higher resolution = sharper on large screens and print."
- Type: 3 radio cards
  - **1K** — "1024×1024px · Web & delivery apps · Starter plan"
  - **2K** — "2048×2048px · Website hero & menus · Pro plan" — "Most Popular" badge
  - **4K** — "4096×4096px · Large format print & ads · Studio plan"
- Auto-advance on selection

### Step 8 — Review & Generate
- Question: "Ready to generate"
- Show a summary card with:
  - Dish name
  - Mode (Enhanced / Generated / style name)
  - Ingredient count + list (collapsed, expandable)
  - Platforms selected (icon list)
  - Resolution
  - Number of variations: stepper control (default 2, min 1, max 8)
- Video upsell banner (orange, dismissible): "🎬 Add a hero video for this dish — cinematic 8s clip. +1 video credit. [Add Video]" — clicking sets a flag
- Big orange "Generate My Photos →" button
- Below button: small text "This will use X credits from your plan"

---

## Navigation
- Progress bar at top (step X of 8), fills orange
- Step counter: "3 / 8" in small zinc-500 text
- Back button (bottom left, zinc-500, text only)
- No Next button on select/card steps — auto-advance
- Next/Continue button on text input steps

---

## State
Use React useState for all wizard state. At the end, console.log the full generation config object (we'll wire the API later):
```
{
  dishName: string,
  hasExistingPhoto: boolean,
  uploadedFile: File | null,
  descriptionSource: 'text' | 'url',
  descriptionRaw: string,
  ingredients: string[],
  style: 'enhanced' | 'generated' | 'michelin' | 'xray' | 'slice',
  platforms: string[],
  resolution: '1k' | '2k' | '4k',
  variations: number,
  addVideo: boolean,
}
```

---

## Nav link
In `app/page.tsx`, update the "Generate Your First Photo →" hero CTA button to link to `/generate` instead of opening the modal.
Also add a "Generate a Photo" link in the nav alongside the existing links.

---

## Style notes
- Match existing site: bg-zinc-950, text-zinc-100, orange-500 accent
- Cards: bg-zinc-900 border border-zinc-800, hover:border-zinc-600
- Selected state: border-orange-500 bg-orange-500/10
- Inputs: border-b-2 border-zinc-600 focus:border-orange-500, bg-transparent
- Transitions: transition-all duration-300 for step changes (fade + slight slide up)
- Keep IntakeForm modal for the "Start Free Trial" / pricing CTAs — wizard is for actual generation

---

## Build & verify
Run `pnpm build` when done. Fix any TypeScript errors.
Do NOT deploy — Dave handles that.

When completely finished, run:
openclaw system event --text "Done: PlateAI generation wizard built at /generate" --mode now

---

## Amendment: Step 4b — Optional/Seasonal Ingredients

After the ingredient confirmation tag list in Step 4, add:

**Optional add-on section** (collapsible, closed by default):
- Toggle label: "+ Add optional or seasonal item"
- When expanded: text input — "e.g. seasonal bok choy, chef's garnish"
- Small helper text: "This will appear in the image caption as 'shown with [item]' — the AI may include it but it won't be listed as a core ingredient"
- Any items added here get stored in `optionalIngredients: string[]` in the config object

**Caption auto-generation rule:**
- If optionalIngredients is non-empty, append to image caption: "shown with [optional items]"
- Example: "Tonkotsu Ramen — shown with seasonal bok choy"

**Serveware step addition (insert into Step 2 — after upload):**
- After photo upload, show a small field: "What style bowl/plate is this served in?"
- Placeholder: "e.g. dark ceramic bowl, white plate, wooden board"
- Pre-fill if we can detect from the reference photo
- Store as `serveware: string` in config
- Inject into generation prompt automatically: "Use the same [serveware] style as shown in the reference photo"
- For Generated mode (no reference photo): make this field required
