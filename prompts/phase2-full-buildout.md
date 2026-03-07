# PlateAI — Phase 2 Full Buildout

You're working in `~/Desktop/plateai` — a Next.js 16 (App Router) marketing + SaaS site for PlateAI.
Dark theme: bg-zinc-950, orange-500 accent, zinc-800 borders. Tailwind CSS v4.

**Goal:** Add authentication (Clerk), before/after gallery + lifecycle sections to homepage, Stripe payments, user dashboard, and wire up the real generation pipeline.

---

## 1. Authentication — Clerk

Install Clerk:
```
pnpm add @clerk/nextjs
```

### Setup
Add to `.env.local` (these will be provided — add placeholders for now):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_PLACEHOLDER
CLERK_SECRET_KEY=sk_test_PLACEHOLDER
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

Wrap `app/layout.tsx` with `<ClerkProvider>`.

Create `middleware.ts` at project root:
```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/generate(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

### Auth pages
Create `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx`.
Both: use `<SignIn />` / `<SignUp />` from Clerk, centered on zinc-950 background with PlateAI logo above.

### Nav updates (`app/page.tsx`)
- If signed out: "Start Free Trial" button → `<SignInButton>` linking to `/sign-up` (keep orange style)
- If signed in: show `<UserButton />` + "Dashboard" nav link

---

## 2. Homepage — Before/After Gallery Section

Add a new section `id="examples"` between "What You Get" and pricing.

### Section header
Title: "Real Restaurant Photos — Before & After"
Subtitle: "Real dishes from real restaurants. Our AI works with what you have."

### Filter pills
Single-select: All | Enhanced | Michelin | Supporting Role. Default: All.

### Before/After slider component
Each card shows a draggable divider. Left = before, right = after. Orange `|` divider with circular handle.
On hover (desktop) or touch (mobile), user can drag to reveal.
Style: `bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition`
Below image: dish name + style badge

**Image pairs** (all in `/public/before-after/`):
1. `wonton-before.png` / `wonton-after.webp` — "Wonton Soup" — Enhanced
2. `tonkotsu-ramen-after.webp` / `tonkotsu-ramen-after.webp` — "Tonkotsu Ramen" — Enhanced
3. `ka-praw-before.png` / `ka-praw-after-v2.webp` — "Ka Praw" — Enhanced
4. `miso-soup-before.png` / `miso-soup-lifestyle-after.webp` — "Miso Soup" — Supporting Role
5. `salmon-carpaccio-before.png` / `salmon-carpaccio-after.webp` — "Salmon Carpaccio" — Michelin
6. `gyoza-soup-before.png` / `gyoza-soup-after-v2.webp` — "Gyoza Soup" — Enhanced

Grid: 2-col mobile, 3-col desktop.

---

## 3. Homepage — Image Lifecycle Section

Add after the before/after gallery, before pricing.

### Header
Title: "One Photo. A Whole Content Engine."
Subtitle: "Every dish photo kicks off a content pipeline — hero video, social clips, ad creative."

### 4-stage flow with arrows between stages

Stage 1 — "Studio Photo" (📸) — Badge: Starter
"AI-generated or enhanced photo for your menu, delivery apps, and Google listing."

Stage 2 — "Hero Video" (🎬) — Badge: Pro
"8-second cinematic clip of your dish. Perfect for your website homepage and social."

Stage 3 — "Social Clips" (✂️) — Badge: Pro
"TikTok, Reels, and Stories — pre-cut to the right ratios. Scheduled automatically."

Stage 4 — "Ad Creative" (📣) — Badge: Studio
"Full ad campaign package. DoorDash promos, Google display, Meta ads — all from your one photo."

Desktop: 4-col row with → arrows. Mobile: vertical stack with ↓ arrows.
Cards: `bg-zinc-900 rounded-xl border border-zinc-800 p-5`
Badge colors: Starter=zinc-600, Pro=blue-600, Studio=orange-500

Below flow, centered CTA:
"Your first photo is free. No credit card required."
[Generate My First Photo →] → /generate

---

## 4. Stripe Payments

Install:
```
pnpm add stripe @stripe/stripe-js
```

Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_PLACEHOLDER
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_PLACEHOLDER
STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER
STRIPE_PRICE_STARTER=price_PLACEHOLDER
STRIPE_PRICE_PRO=price_PLACEHOLDER
STRIPE_PRICE_STUDIO=price_PLACEHOLDER
```

### `lib/plans.ts`
```ts
export const PLANS = {
  starter: {
    name: "Starter",
    price: 49,
    credits: 20,
    features: ["10 photos/mo", "Enhanced + Generated styles", "1K resolution", "All 7 platforms"],
    stripePriceId: process.env.STRIPE_PRICE_STARTER!,
  },
  pro: {
    name: "Pro",
    price: 99,
    credits: 60,
    features: ["30 photos/mo", "All styles incl. Michelin, X-Ray, Slice", "2K resolution", "Hero videos", "Social clip cuts"],
    stripePriceId: process.env.STRIPE_PRICE_PRO!,
    popular: true,
  },
  studio: {
    name: "Studio",
    price: 199,
    credits: 999,
    features: ["Unlimited photos", "Unlimited videos", "4K resolution", "Full ad creative packs", "Priority generation"],
    stripePriceId: process.env.STRIPE_PRICE_STUDIO!,
  },
};
```

### `lib/credits.ts`
```ts
export const CREDIT_COST = { photo: 2, video: 5, social_cut: 1 };

export function creditsForGeneration(config: { variations: number; addVideo: boolean }) {
  return config.variations * CREDIT_COST.photo + (config.addVideo ? CREDIT_COST.video : 0);
}
```

### API routes

**`app/api/stripe/create-checkout/route.ts`**
POST, requires Clerk auth. Body: `{ plan: 'starter' | 'pro' | 'studio' }`.
Creates Stripe Checkout session with `client_reference_id: userId`.
success_url: `/dashboard?upgraded=1`, cancel_url: `/pricing`.
Returns `{ url }`.

**`app/api/stripe/webhook/route.ts`**
POST, raw body, verify with `stripe.webhooks.constructEvent`.
On `checkout.session.completed`: store plan in `@vercel/kv` as `user:{userId}:plan`.
On `customer.subscription.deleted`: reset to free.

### Homepage pricing buttons
Wire each plan button: if signed out → `/sign-up`, if signed in → POST to create-checkout then redirect to Stripe URL.

---

## 5. User Dashboard (`/dashboard`)

`app/dashboard/page.tsx` — server component, Clerk-protected.

### Sidebar layout
Left sidebar (hidden on mobile):
- PlateAI logo
- Nav: Dashboard, Generate (/generate), My Photos (/dashboard/photos), Settings
- Bottom: `<UserButton />` + plan badge

### Dashboard home
**Credits widget** (card, top right):
- Plan name + credits remaining / total
- Progress bar (orange)
- "Upgrade" link if Starter or free

**Quick Generate** (prominent center card):
- Big orange "Generate a New Photo →" button → /generate
- "X credits remaining" subtext

**Recent Generations** (grid):
- Empty state: "No photos yet. Generate your first →"
- After generation: show thumbnails pulled from KV

### `/dashboard/photos` page
Full gallery of user's saved images. Empty state if none.

---

## 6. Wire Up Generation Pipeline

Update `app/generate/page.tsx` — Step 8 "Generate My Photos →" button:

### Auth gate
- If not signed in: redirect to `/sign-up?redirect=/generate`
- If signed in but zero credits: show an inline upgrade prompt (orange banner)

### Generation flow
1. Show shimmer loading cards (one per variation)
2. POST to `/api/generate` with full wizard config
3. On success, show results panel (replaces wizard)

### Results panel
Grid of generated images (2-col).
Each image on hover: "Download", "Save to Dashboard", "Animate →" (Pro upsell if Starter).
"Generate Another" button → resets wizard state.

**`app/api/photos/save/route.ts`** (new):
POST, requires auth. Body: `{ images: string[], dishName: string, style: string }`.
Appends to KV list `user:{userId}:photos`. Returns saved entries.

Also deduct credits: read `user:{userId}:credits` from KV, subtract, write back. 
Free tier seed: if key doesn't exist, initialize with 10 credits.

---

## Build order
1. `pnpm add @clerk/nextjs stripe @stripe/stripe-js`
2. Add .env.local placeholders
3. Clerk middleware + ClerkProvider in layout
4. Sign-in / sign-up pages
5. Before/after gallery section on homepage
6. Lifecycle section on homepage
7. Update nav + pricing buttons
8. `lib/plans.ts` + `lib/credits.ts`
9. Stripe API routes
10. Dashboard layout + pages
11. Update generate page (auth gate + results panel)
12. `/api/photos/save` route

---

## Constraints
- Keep all existing homepage sections — only ADD, don't replace
- Dark theme only: zinc-950 body, zinc-900 cards, orange-500 accent
- No light mode, no external UI libraries beyond Tailwind
- Mobile-first responsive

---

## Finish
Run `pnpm build` — fix all TypeScript/lint errors before finishing.
Do NOT run `pnpm dev`, do NOT deploy.
Output a summary of every file created or modified when done.
