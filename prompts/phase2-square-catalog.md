# PlateAI — Addendum: Square Catalog Integration

Add this on top of everything else in the phase 2 build. This is the Square POS integration — it lets restaurant owners connect their Square account, import their full menu catalog, and generate + sync photos back to Square automatically.

---

## Overview

Flow:
1. User clicks "Connect Square" on their dashboard
2. OAuth flow — PlateAI gets read/write access to their Square catalog
3. PlateAI imports all catalog items (name, description, category, existing image if any)
4. User can bulk-generate photos for any or all items in one click
5. Generated photos sync back to Square item images automatically
6. Photos appear in Square POS, Square Online, and delivery integrations

---

## Square OAuth

Add to `.env.local`:
```
SQUARE_OAUTH_CLIENT_ID=sq0idp-YQEMFOKu8D4hpsNSe9Ke8Q
SQUARE_OAUTH_CLIENT_SECRET=PLACEHOLDER
SQUARE_OAUTH_REDIRECT_URI=https://getplateai.com/api/square/oauth/callback
```

### `app/api/square/oauth/connect/route.ts`
GET — redirects user to Square OAuth authorization URL:
```
https://connect.squareup.com/oauth2/authorize
  ?client_id={SQUARE_OAUTH_CLIENT_ID}
  &scope=ITEMS_READ+ITEMS_WRITE+MERCHANT_PROFILE_READ
  &session=false
  &state={userId}
```
Return a redirect response.

### `app/api/square/oauth/callback/route.ts`
GET — handles Square redirect with `?code=` + `?state=userId`.
Exchange code for token:
```
POST https://connect.squareup.com/oauth2/token
{ client_id, client_secret, code, grant_type: "authorization_code", redirect_uri }
```
Store in KV:
```ts
await kv.set(`user:${userId}:square_oauth`, {
  accessToken: result.access_token,
  merchantId: result.merchant_id,
  expiresAt: result.expires_at,
});
```
Redirect to `/dashboard/catalog`.

---

## Catalog Import

### `app/api/square/catalog/sync/route.ts`
POST, requires Clerk auth.
Uses the user's OAuth access token (from KV) — NOT the PlateAI master token.

1. Call Square Catalog API: `GET /v2/catalog/list?types=ITEM`
2. For each item, extract:
   - `id`, `name`, `description`, `category`, `variations[0].price_money`
   - `image_ids[0]` if exists (fetch image URL separately)
3. Store in KV as `user:{userId}:catalog` — array of:
```ts
{
  squareItemId: string,
  name: string,
  description: string,
  category: string,
  price: number,        // cents
  existingImageUrl: string | null,
  plateaiImageUrl: string | null,   // null until generated
  status: "pending" | "generated" | "synced",
}
```
4. Return `{ imported: number }` count.

---

## Dashboard — Catalog Page (`/dashboard/catalog`)

### Header
"Your Square Menu" + "X items imported" badge + "Sync Catalog" button (re-runs import).

### Catalog grid
Table or card grid. Columns: Photo thumbnail | Item name | Category | Price | Status | Actions.

Status badges:
- `pending` = gray "No Photo"
- `generated` = blue "Generated"  
- `synced` = green "Live on Square"

Actions per item:
- "Generate" button (uses 2 credits) — opens a mini wizard pre-filled with item name + description
- "Sync to Square" button (appears after generated) — pushes image URL back to Square
- Thumbnail shows existing Square image or PlateAI generated image

### Bulk actions bar (sticky at bottom when items selected):
- Checkboxes on each row
- "Generate Selected (X credits)" — bulk generates all selected items
- "Sync All to Square" — pushes all generated images back

### Empty state
"No catalog connected. [Connect your Square account →]" — links to `/api/square/oauth/connect`

---

## Sync Photos Back to Square

### `app/api/square/catalog/push-image/route.ts`
POST, requires Clerk auth.
Body: `{ squareItemId: string, imageUrl: string }`

1. Get user's OAuth token from KV
2. Download the image from `imageUrl` into a buffer
3. Upload to Square as a CatalogImage:
```ts
// First upload the image file
POST /v2/catalog/images
multipart/form-data:
  - request: JSON { idempotency_key, object_id: squareItemId, image: { type: "IMAGE", image_data: { name, caption } } }
  - image_file: the image buffer
```
4. Square returns a new image object ID — Square automatically links it to the item
5. Update KV: set item `status: "synced"` + `plateaiImageUrl`
6. Return `{ success: true, squareImageId }`

---

## Dashboard — Connect Square card (`/dashboard`)

Add a card to the dashboard home (above Recent Generations):

```
📷  Connect your Square account
Import your full menu and generate photos for every item in one click.
[Connect Square →]
```

If already connected: show "✅ Square connected · 47 items · [View Catalog]"

---

## Mini generation wizard for catalog items

When user clicks "Generate" on a catalog item, open a simplified modal (not the full 8-step wizard):

- Pre-filled: dish name, description → auto-parsed ingredients
- Style picker (same 5 styles)
- Variations: 1–4 (default 2)
- "Generate →" button

On complete: show results inline in the modal. "Use this photo" button → calls push-image API + closes modal.

---

## Square App Marketplace prep

Add `app/square-app/page.tsx` — a simple landing page for Square's App Marketplace listing:
- URL: `/square-app`
- Content: PlateAI logo, tagline, 3 bullet features, "Connect with Square" button → `/api/square/oauth/connect`
- This is the page Square links to from the marketplace

---

## Build order for this addendum (after the main phase 2 build)
1. Square OAuth routes (connect + callback)
2. Catalog sync API route
3. `/dashboard/catalog` page
4. Push-image API route
5. Dashboard "Connect Square" card
6. Mini generation modal for catalog items
7. `/square-app` marketplace landing page

---

## Notes
- User's Square OAuth token is stored per-user in KV — completely separate from PlateAI's own Square account
- PlateAI's master Square token (for subscriptions/payments) is never used for catalog operations
- This works for ANY Square merchant — not just Red Bar
- Target: submit to Square App Marketplace once live
