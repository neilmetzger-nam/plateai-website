# PlateAI — Square Payments (replaces Stripe section in phase2-full-buildout.md)

Use this section INSTEAD of the Stripe section in the main prompt.

---

## Square Payments

Install Square SDK:
```
pnpm add squareup
```

Add to `.env.local`:
```
SQUARE_ACCESS_TOKEN=EAAAl1WJ6-4jJrN_BmRn0oRDh6nj1PeU5XtoTicmXd-4b4KSuRbvPSibtNdUJ70P
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-YQEMFOKu8D4hpsNSe9Ke8Q
SQUARE_LOCATION_ID=L4BMAT2DZWQP0
SQUARE_ENVIRONMENT=production

# Subscription Plan IDs — fill in after creating plans in Square Dashboard
SQUARE_PLAN_STARTER=PLACEHOLDER
SQUARE_PLAN_PRO=PLACEHOLDER
SQUARE_PLAN_STUDIO=PLACEHOLDER
```

---

### `lib/plans.ts`
```ts
export const PLANS = {
  starter: {
    name: "Starter",
    price: 49,
    credits: 20,
    features: ["10 photos/mo", "Enhanced + Generated styles", "1K resolution", "All 7 platforms"],
    squarePlanId: process.env.SQUARE_PLAN_STARTER!,
  },
  pro: {
    name: "Pro",
    price: 99,
    credits: 60,
    features: ["30 photos/mo", "All styles incl. Michelin, X-Ray, Slice", "2K resolution", "Hero videos", "Social clips"],
    squarePlanId: process.env.SQUARE_PLAN_PRO!,
    popular: true,
  },
  studio: {
    name: "Studio",
    price: 199,
    credits: 999,
    features: ["Unlimited photos", "Unlimited videos", "4K resolution", "Ad creative packs", "Priority generation"],
    squarePlanId: process.env.SQUARE_PLAN_STUDIO!,
  },
};
```

---

### Payment flow overview

Square doesn't have a hosted checkout redirect like Stripe. Instead:
1. Frontend loads Square Web Payments SDK (CDN script tag)
2. User fills in card details in a Square-hosted iframe (secure, PCI compliant)
3. Frontend tokenizes the card → gets a `sourceId` (nonce)
4. POST nonce + plan to our API
5. API: create/find Square Customer, save card on file, create Subscription

---

### Frontend — Checkout modal (`app/components/CheckoutModal.tsx`)

Client component. Opens when user clicks a pricing plan button.

```tsx
// Load Square Web Payments SDK
// <script src="https://sandbox.web.squarecdn.com/v1/square.js"> for sandbox
// <script src="https://web.squarecdn.com/v1/square.js"> for production
```

Modal layout (dark theme, zinc-900 background):
- Header: "Subscribe to [Plan Name] — $X/mo"
- Square card payment iframe (mounts into a div with id="card-container")
- "Start Subscription →" orange button
- Small text: "Powered by Square · Cancel anytime"
- Error message display area

On submit:
1. Call `payments.tokenize()` to get `sourceId`
2. POST to `/api/square/subscribe` with `{ plan, sourceId, email }`
3. On success: redirect to `/dashboard?upgraded=1`
4. On error: show error message in modal

Initialize Square in useEffect:
```ts
const payments = window.Square.payments(
  process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
  process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID  // add this env var too
);
const card = await payments.card();
await card.attach("#card-container");
```

Add `NEXT_PUBLIC_SQUARE_LOCATION_ID=L4BMAT2DZWQP0` to `.env.local`.

---

### `app/api/square/subscribe/route.ts`

POST, requires Clerk auth.

```ts
import { Client, Environment } from "squareup";
import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: Environment.Production,
});
```

Flow:
1. Get `userId` from Clerk auth
2. Check if customer already exists: `kv.get(`user:${userId}:square_customer_id`)`
3. If not, create Square Customer:
   ```ts
   const { result } = await client.customersApi.createCustomer({
     emailAddress: email,
     referenceId: userId, // Clerk user ID
   });
   customerId = result.customer.id;
   await kv.set(`user:${userId}:square_customer_id`, customerId);
   ```
4. Save card on file:
   ```ts
   const { result } = await client.cardsApi.createCard({
     idempotencyKey: `${userId}-${Date.now()}`,
     sourceId: sourceId, // nonce from frontend
     card: { customerId },
   });
   cardId = result.card.id;
   ```
5. Create subscription:
   ```ts
   const { result } = await client.subscriptionsApi.createSubscription({
     idempotencyKey: `sub-${userId}-${Date.now()}`,
     locationId: process.env.SQUARE_LOCATION_ID!,
     planVariationId: PLANS[plan].squarePlanId,
     customerId,
     cardId,
     startDate: new Date().toISOString().split("T")[0],
   });
   ```
6. Store plan in KV: `kv.set(`user:${userId}:plan`, plan)`
7. Seed credits: `kv.set(`user:${userId}:credits`, PLANS[plan].credits)`
8. Return `{ success: true }`

Error handling: return 402 for payment failures with `{ error: result.errors[0].detail }`.

---

### `app/api/square/webhook/route.ts`

POST — Square sends subscription lifecycle events here.
Set webhook URL in Square Dashboard → Webhooks: `https://getplateai.com/api/square/webhook`

Events to handle:
- `subscription.updated` — on renewal, top up credits
- `subscription.deleted` / `subscription.deactivated` — reset plan to free in KV

Verify Square webhook signature using `Square-Signature` header.

---

### Square Dashboard setup (manual — Neil does this)

Before the code will work, create 3 subscription plans in Square Dashboard:
1. Go to square.com → Items → Subscriptions → Create plan
2. Create: Starter ($49/mo), Pro ($99/mo), Studio ($199/mo)
3. Copy the Plan Variation IDs into `.env.local` as `SQUARE_PLAN_STARTER`, etc.

---

### Homepage pricing buttons

In `app/page.tsx`, update each plan's CTA button:
- If signed out: link to `/sign-up`
- If signed in: open `<CheckoutModal plan="starter|pro|studio" />`

Free trial button stays as-is → `/sign-up`.

