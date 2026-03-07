# PlateAI — Phase 2 Full Buildout

Working directory: `~/Desktop/plateai` — Next.js 16 App Router, Tailwind CSS v4.
Dark theme: bg-zinc-950 body, bg-zinc-900 cards, orange-500 accent, zinc-800 borders.

**Goal:** Add Clerk authentication, before/after gallery + lifecycle sections to homepage, Square subscription payments, user dashboard, and wire up the real generation pipeline.

---

## 1. Authentication — Clerk

Install:
```
pnpm add @clerk/nextjs
```

Add to `.env.local` (use PLACEHOLDER — keys will be added later):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=PLACEHOLDER
CLERK_SECRET_KEY=PLACEHOLDER
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
Both: `<SignIn />` / `<SignUp />` from Clerk, centered on zinc-950 background with PlateAI logo above.

### Nav updates (`app/page.tsx`)
- If signed out: "Start Free Trial" → `<SignInButton>` linking to `/sign-up` (keep orange button style)
- If signed in: show `<UserButton />` + "Dashboard" nav link

---

## 2. Homepage — Before/After Gallery Section

Add a new section `id="examples"` between "What You Get" and pricing. Keep all existing sections intact.

### Section header
Title: "Real Restaurant Photos — Before & After"
Subtitle: "Real dishes from real restaurants. Our AI works with what you have."

### Filter pills
Single-select row: All | Enhanced | Michelin | Supporting Role. Default: All.

### Before/After slider component
Each card has a draggable divider — left = before, right = after. Orange `|` divider line with a circular handle. User drags to reveal on hover (desktop) or touch (mobile).

Card style: `bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition`
Below image: dish name + style badge pill.

**Image pairs** (all in `/public/before-after/`):
1. `wonton-before.png` / `wonton-after.webp` — "Wonton Soup" — Enhanced
2. `tonkotsu-ramen-before.png` / `tonkotsu-ramen-after.webp` — "Tonkotsu Ramen" — Enhanced
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

### 4-stage flow

Stage 1 — 📸 "Studio Photo" — Badge: Starter
"AI-generated or enhanced photo for your menu, delivery apps, and Google listing."

Stage 2 — 🎬 "Hero Video" — Badge: Pro
"8-second cinematic clip of your dish. Perfect for your website homepage and social."

Stage 3 — ✂️ "Social Clips" — Badge: Pro
"TikTok, Reels, and Stories — pre-cut to the right ratios. Scheduled automatically."

Stage 4 — 📣 "Ad Creative" — Badge: Studio
"Full ad campaign package. DoorDash promos, Google display, Meta ads — all from one photo."

Desktop: 4-col row with → arrows between stages. Mobile: vertical stack with ↓ arrows.
Cards: `bg-zinc-900 rounded-xl border border-zinc-800 p-5`
Badge colors: Starter=zinc-600, Pro=blue-600, Studio=orange-500

Below the flow, centered CTA:
"Your first photo is free. No credit card required."
[Generate My First Photo →] → /generate

---

## 4. Square Payments

Install:
```
pnpm add squareup
```

Add to `.env.local`:
```
SQUARE_ACCESS_TOKEN=EAAAl1WJ6-4jJrN_BmRn0oRDh6nj1PeU5XtoTicmXd-4b4KSuRbvPSibtNdUJ70P
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-YQEMFOKu8D4hpsNSe9Ke8Q
NEXT_PUBLIC_SQUARE_LOCATION_ID=L4BMAT2DZWQP0
SQUARE_LOCATION_ID=L4BMAT2DZWQP0
SQUARE_ENVIRONMENT=production
SQUARE_PLAN_VARIATION_ID=JTHLXQKKDRS5FJ7DEAVHMEIX
SQUARE_ITEM_STARTER=ZECAJGP5LCO6PJSGLG2ENSOE
SQUARE_ITEM_PRO=BM4QPVZPGDPHH7NJCYYCB5SR
SQUARE_ITEM_STUDIO=PW255JEQL3W3YZNSBBLCMM6C
```

### `lib/plans.ts`
```ts
export const PLANS = {
  starter: {
    name: "Starter",
    price: 49,
    credits: 20,
    features: ["10 photos/mo", "Enhanced + Generated styles", "1K resolution", "All 7 platforms"],
    squareItemVariationId: process.env.SQUARE_ITEM_STARTER!,
  },
  pro: {
    name: "Pro",
    price: 99,
    credits: 60,
    features: ["30 photos/mo", "All styles incl. Michelin, X-Ray, Slice", "2K resolution", "Hero videos", "Social clips"],
    squareItemVariationId: process.env.SQUARE_ITEM_PRO!,
    popular: true,
  },
  studio: {
    name: "Studio",
    price: 199,
    credits: 999,
    features: ["Unlimited photos", "Unlimited videos", "4K resolution", "Ad creative packs", "Priority generation"],
    squareItemVariationId: process.env.SQUARE_ITEM_STUDIO!,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
```

### `lib/credits.ts`
```ts
export const CREDIT_COST = { photo: 2, video: 5, social_cut: 1 };

export function creditsForGeneration(config: { variations: number; addVideo: boolean }) {
  return config.variations * CREDIT_COST.photo + (config.addVideo ? CREDIT_COST.video : 0);
}
```

### Checkout modal (`app/components/CheckoutModal.tsx`)

Client component. Opens when user clicks a plan button.

Load Square Web Payments SDK via script tag in layout (production):
```
https://web.squarecdn.com/v1/square.js
```

Modal layout (zinc-900 background, max-w-lg, centered):

**Left/top — Plan summary card:**
- Plan name + price badge ("Pro — $99/mo")
- Bullet list of plan features
- "Most Popular" badge if applicable
- Trust line: "Cancel anytime. No contracts."

**Right/bottom — Payment form:**
- Label: "Card details"
- Square card iframe: `<div id="card-container" />`
- Orange "Start Subscription →" button
- Below button: 🔒 "Secured by Square" · "Your card is charged today. Next billing in 30 days."
- Error message area (red text, shown on failure)

On desktop: side-by-side layout (plan summary left, card form right).
On mobile: stacked (summary on top, form below).

Initialize Square in useEffect:
```ts
const payments = (window as any).Square.payments(
  process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
  process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
);
const card = await payments.card();
await card.attach("#card-container");
```

On submit:
1. `const result = await card.tokenize()` → get `sourceId`
2. POST to `/api/square/subscribe` with `{ plan, sourceId, email }`
3. Success → redirect to `/dashboard?upgraded=1`
4. Error → show `result.errors[0].message` in error area

### `app/api/square/subscribe/route.ts`

POST, requires Clerk auth. Body: `{ plan: PlanKey, sourceId: string, email: string }`.

```ts
import { Client, Environment } from "squareup";
import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import { PLANS } from "@/lib/plans";

const square = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: Environment.Production,
});
```

Flow:
1. Get `userId` from Clerk `auth()`
2. Check KV for existing customer: `kv.get(\`user:${userId}:square_customer_id\`)`
3. If none, create Square Customer with `emailAddress` + `referenceId: userId`; store ID in KV
4. Create card on file via `square.cardsApi.createCard({ sourceId, card: { customerId } })`
5. Create subscription:
```ts
await square.subscriptionsApi.createSubscription({
  idempotencyKey: `sub-${userId}-${Date.now()}`,
  locationId: process.env.SQUARE_LOCATION_ID!,
  planVariationId: process.env.SQUARE_PLAN_VARIATION_ID!,
  customerId,
  cardId,
  startDate: new Date().toISOString().split("T")[0],
  phases: [{ ordinal: BigInt(0), orderTemplateId: undefined }],
});
```
6. Store plan + credits in KV:
```ts
await kv.set(`user:${userId}:plan`, plan);
await kv.set(`user:${userId}:credits`, PLANS[plan].credits);
```
7. Return `{ success: true }`

Return 402 with `{ error }` on Square payment failure.

### `app/api/square/webhook/route.ts`

POST — verify Square-Signature header. Handle:
- `subscription.updated` → top up credits for renewal
- `subscription.deleted` / `subscription.deactivated` → `kv.set(\`user:${userId}:plan\`, "free")`

Set webhook URL in Square Dashboard: `https://getplateai.com/api/square/webhook`

### Homepage pricing buttons (`app/page.tsx`)
- If signed out → link to `/sign-up`
- If signed in → open `<CheckoutModal plan="starter|pro|studio" />`
- Free trial button stays as-is → `/sign-up`

---

## 5. User Dashboard (`/dashboard`)

`app/dashboard/layout.tsx` — server component with sidebar.

### Sidebar
Left sidebar, hidden on mobile (hamburger menu):
- PlateAI logo at top
- Nav links: Dashboard (`/dashboard`), Generate (`/generate`), My Photos (`/dashboard/photos`), Settings (`/dashboard/settings`)
- Bottom: `<UserButton />` from Clerk + plan badge pill

### `app/dashboard/page.tsx`

**Credits widget** (top-right card):
- Plan name (pulled from KV) + "X credits remaining / Y total"
- Orange progress bar
- "Upgrade Plan →" link if on free tier

**Quick Generate card** (center, prominent):
- Big orange "Generate a New Photo →" → /generate
- "X credits remaining" subtext

**Recent Generations grid:**
- Pull from KV `user:{userId}:photos`
- Empty state: "No photos yet. [Generate your first →]"
- Show image thumbnails in 3-col grid with dish name below

### `app/dashboard/photos/page.tsx`
Full gallery of all user photos from KV. Empty state if none.

---

## 6. Wire Up Generation Pipeline

Update `app/generate/page.tsx` — Step 8 "Generate My Photos →" button:

### Auth gate
- If not signed in: show inline banner "Sign in to generate" with link to `/sign-up?redirect=/generate`
- If signed in + zero credits: orange banner "You're out of credits — [Upgrade your plan]"

### Generation flow
1. Show shimmer loading cards (one per variation, matching final card size)
2. POST to `/api/generate` with full wizard config object
3. On success: replace wizard with results panel

### Results panel (replaces wizard on completion)
2-col image grid. Each image on hover shows action buttons:
- "⬇ Download" — triggers browser download
- "💾 Save to Dashboard" — POST to `/api/photos/save`
- "🎬 Animate →" — if Starter plan, show upgrade tooltip; if Pro+, placeholder for video generation

"Generate Another" button → resets all wizard state back to Step 1.

### `app/api/photos/save/route.ts`
POST, requires Clerk auth.
Body: `{ images: string[], dishName: string, style: string }`
Append entry to KV list `user:{userId}:photos` (use `kv.lpush`).
Deduct credits: read `user:{userId}:credits`, subtract `CREDIT_COST.photo * images.length`, write back.
Free tier seed: if credits key doesn't exist, initialize to 10.
Return `{ saved: true }`.

---

## Build order
1. `pnpm add @clerk/nextjs squareup`
2. Add all env vars above to `.env.local`
3. Clerk middleware + ClerkProvider in layout
4. Sign-in / sign-up pages
5. `lib/plans.ts` + `lib/credits.ts`
6. Before/after gallery section on homepage
7. Lifecycle section on homepage
8. Update nav + pricing buttons
9. Checkout modal component
10. Square API routes (subscribe + webhook)
11. Dashboard layout + pages
12. Update generate page (auth gate + results panel)
13. `/api/photos/save` route

---

## Constraints
- Keep ALL existing homepage sections — only ADD new ones, never replace
- Dark theme only throughout: zinc-950 body, zinc-900 cards, orange-500 accent
- No light mode
- No external UI libraries beyond what's already installed (Tailwind only)
- Mobile-first responsive

---

## Finish
Run `pnpm build` — fix all TypeScript/lint errors.
Do NOT run `pnpm dev`. Do NOT deploy.
Output a summary of every file created or modified.
