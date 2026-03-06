# PlateAI — Chat Refinement Widget

## Overview
Add a floating AI chat assistant to the PlateAI site that helps users refine 
their generated food photos through natural language. Uses OpenAI GPT-4o-mini 
(cheap, fast) on the backend.

---

## Files to create

### 1. `app/api/chat/route.ts`
API route that:
- Accepts POST with `{ messages: [], generationConfig: {} }`
- Calls OpenAI chat completions (model: gpt-4o-mini)
- System prompt:
```
You are PlateAI's food photography assistant. Your job is to help restaurant 
owners refine AI-generated food photos through conversation.

When a user describes a problem with their image (e.g. "the nori is in the 
wrong position", "the broth looks too pale", "add more steam"), you:
1. Acknowledge what they want to change
2. Explain what prompt modification will fix it
3. Return a JSON object with the updated prompt additions

Always respond in this format:
{
  "message": "Your conversational reply here",
  "promptAddition": "specific prompt text to add",
  "creditCost": 1
}

Rules:
- Never add ingredients not in the original ingredient list
- Never suggest changes that would misrepresent the dish
- Keep prompt additions concise and specific
- If the user asks for something impossible or that would violate accuracy rules, 
  explain why and suggest an alternative
```
- Return the assistant's message + promptAddition
- Requires OPENAI_API_KEY env var

### 2. `app/components/ChatRefinement.tsx`
Floating chat widget component:

**Trigger button:**
- Fixed bottom-right corner: `fixed bottom-6 right-6 z-50`
- Orange circle button with chat bubble icon
- Shows credit cost badge: "1 credit per refinement"
- Only renders on `/generate` page and future results page

**Chat panel (opens on click):**
- Slides up from bottom-right, `w-80 h-96`
- Dark panel: `bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl`
- Header: "Plate AI — Photo Refinement" + close button + credits remaining badge
- Message list (scrollable): alternating user (right, orange bubble) / assistant (left, zinc bubble)
- Input bar at bottom: text input + send button
- Loading state: animated dots while waiting for response

**Initial message from assistant (on open):**
```
Hi! I'm here to help you refine your photo. Tell me what you'd like to change — 
for example: "make the broth richer", "the egg needs to face the camera more", 
or "add more steam". Each refinement costs 1 credit.
```

**After assistant responds:**
- Show the `promptAddition` as a copyable code block
- Show a "Regenerate with this fix →" button (orange)
- Clicking it deducts 1 credit, fires a new generation with the modified prompt
- For now: just console.log the new generation config (API wired later)

**Credit display:**
- Mock credits: start at 5 for demo purposes
- Show "X credits remaining" in header
- When 0 credits: show "Top up credits" button linking to `#pricing`
- Store in localStorage: `plateai-chat-credits`

### 3. Add to layout
Import ChatRefinement in `app/layout.tsx` and render it globally.

---

## Environment variable needed
Add to `.env.local`:
```
OPENAI_API_KEY=your_key_here
```

---

## Build & verify
`pnpm build` — fix any TypeScript errors.
Do NOT deploy.

When finished run:
openclaw system event --text "Done: PlateAI chat refinement widget built" --mode now
