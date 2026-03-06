# PlateAI — SMS Photo Enhancement Webhook

## Overview
Build a Twilio SMS/MMS webhook that lets restaurant owners text a food photo 
to the PlateAI number and receive an AI-enhanced version back via MMS.

Flow:
1. Restaurant owner texts a photo to +1-833-324-7207
2. Twilio sends webhook POST to /api/sms
3. Our API downloads the image from Twilio
4. Calls OpenAI GPT-4o-mini vision to analyze the dish and build a prompt
5. Sends prompt + image to Fal.ai for enhancement
6. Replies via Twilio MMS with the enhanced image + a short message

---

## Files to create

### `app/api/sms/route.ts`

POST handler for Twilio webhook.

```typescript
// Required env vars:
// TWILIO_ACCOUNT_SID=ACb8391ed8d92871d85180ca9adea481b6
// TWILIO_AUTH_TOKEN=<from console>
// TWILIO_PHONE_NUMBER=+18333247207
// FAL_AI_API_KEY=9d0eb593-7e0a-4a82-ae01-531058de2a9a:dda4088b8ef43754ca4e6ea02374c900
// OPENAI_API_KEY=<already set>
```

**Step 1 — Parse Twilio webhook:**
- Parse `application/x-www-form-urlencoded` body
- Extract: `From`, `Body` (text message), `NumMedia`, `MediaUrl0`, `MediaContentType0`
- If `NumMedia === "0"`: reply with TwiML: "Hi! Send us a photo of your dish and we'll enhance it for you. 📸"
- If has media: proceed

**Step 2 — Download the image:**
- Fetch `MediaUrl0` with Basic Auth (TWILIO_ACCOUNT_SID:TWILIO_AUTH_TOKEN)
- Convert to base64

**Step 3 — Analyze with OpenAI Vision:**
- Call GPT-4o-mini with the image
- System prompt:
```
You are a food photography expert. Analyze this restaurant food photo and 
return a JSON object with:
{
  "dishName": "detected dish name",
  "cuisine": "cuisine type",
  "ingredients": ["list", "of", "visible", "ingredients"],
  "enhancementPrompt": "Professional food photography of [dish]. [describe ideal enhanced version with proper lighting, plating, colors]. Dark background, dramatic side lighting, steam if hot dish. Photorealistic, restaurant menu quality, 1:1 square."
}
Return only valid JSON.
```

**Step 4 — Enhance with Fal.ai:**
- Use fal.ai endpoint: `fal-ai/flux/dev/image-to-image`
- Input: base64 image + enhancementPrompt from GPT
- strength: 0.65 (enhance, don't fully replace)
- image_size: "square_hd"
- num_images: 1

**Step 5 — Reply via Twilio:**
- Send TwiML MMS response with:
  - The enhanced image URL from Fal.ai
  - Message: "✨ Here's your enhanced photo for [dishName]! Reply with another photo to enhance more, or visit getplateai.com to see all our features."
- Return TwiML response with Content-Type: text/xml

**Error handling:**
- If Fal.ai fails: reply "We're having trouble enhancing that photo. Please try again!"
- If no dish detected: reply "We couldn't identify a dish in that photo. Please send a clear photo of a single menu item."

---

### TwiML response helper

```typescript
function twimlResponse(message: string, mediaUrl?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    ${mediaUrl ? `<Media>${mediaUrl}</Media>` : ''}
    <Body>${message}</Body>
  </Message>
</Response>`;
}
```

---

## Install dependencies needed:
```bash
pnpm add twilio @fal-ai/client
```

---

## Environment variables to add to .env.local:
```
TWILIO_ACCOUNT_SID=ACb8391ed8d92871d85180ca9adea481b6
TWILIO_AUTH_TOKEN=REPLACE_WITH_REAL_TOKEN
TWILIO_PHONE_NUMBER=+18333247207
FAL_AI_API_KEY=9d0eb593-7e0a-4a82-ae01-531058de2a9a:dda4088b8ef43754ca4e6ea02374c900
```

---

## After building, add to the PlateAI homepage

In `app/page.tsx`, add a small "Text Us a Photo" section near the CTA:

```
📱 Try it right now — no signup needed
Text a photo of any dish to (833) 324-7207
We'll send back an enhanced version in under 3 minutes. Free.
```

Style: simple zinc-900 card, orange phone icon, the number in large white text.
This goes between the Before/After section and the Pricing section.

---

## Build & verify
pnpm build — fix TypeScript errors.
Do NOT deploy — Dave will handle Vercel + Twilio webhook config.

When finished run:
openclaw system event --text "Done: PlateAI SMS photo enhancement webhook built" --mode now
