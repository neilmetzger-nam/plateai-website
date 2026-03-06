# PlateAI Generation Rules

## Accuracy First
- Every image must match the dish description exactly
- NO ingredients added that aren't in the description
- NO ingredients removed or hidden that ARE in the description
- Portion counts matter (e.g. "3 dumplings" must show 3, not 2 or 4)

## Description Sourcing (required before generation)
Owner must provide ONE of:
1. Written ingredient list
2. Link to their website menu
3. Link to their DoorDash/UberEats listing
4. Link to their Shopify/POS menu

We pull the description, confirm with owner, THEN generate.

## Enhanced Mode Rules
- Start from owner's real photo as reference
- Enhance: lighting, color saturation, contrast, background
- Preserve: all visible ingredients, portion sizes, plating style
- Fix: seams, bad backgrounds, poor lighting, small subject in frame
- Never: add UNAUTHORIZED garnishes, change proteins, swap ingredients
- Once owner confirms an ingredient (e.g. fried egg), remove the "no added ingredients" constraint — it is now an approved ingredient
- Rule is: no UNAUTHORIZED additions, not no additions at all

## Generated Mode Rules  
- Use verified description only
- Show ALL ingredients listed — none hidden, none missing
- Portion counts must match (3 dumplings = 3 dumplings visible)
- Style matches cuisine type (Thai ≠ Japanese ≠ Italian plating)

## Intake Flow Addition (Step 6)
After cuisine type, ask:
"Paste your menu description or a link to your online menu"
→ We extract ingredients, confirm with owner before generating

## Quality Check Before Delivery
- Cross-reference generated image against ingredient list
- Flag any missing or added items
- Re-generate if inaccurate (included in all plans)

## Serveware Rule
- Always specify: "Use the same bowl/plate style as shown in the reference photo"
- This preserves brand identity and prevents customer confusion
- If no reference photo, ask owner: "What style bowl/plate do you use?" (white ceramic / dark ceramic / wooden board / etc.)

## Optional/Seasonal Ingredients Rule
- If AI adds an ingredient not in the description, flag it
- Owner can approve with a note: "shown with seasonal bok choy" or "served with chef's garnish"
- Add approved extras to the description with "(optional)" or "(seasonal)" label
- Never silently add ingredients — always disclose
- Wizard Step 4 (ingredient confirm) should show a warning if we detect the generated image contains unconfirmed items

## Soup/Broth Photography Rules
- Always specify warm broth tone: "rich warm golden broth" not "clear broth"
- Always add: "soft fill light from the left to lift shadow detail"
- Clear broth dishes: add "slight golden sheen on broth surface"
- Steam is mandatory for all hot soups

## Platform Variant Strategy
- Delivery (DD/UE/GH): brighter, cleaner, high contrast — food reads fast at small sizes
- Website/Social: moodier, dramatic lighting, more atmospheric
- Auto-generate both variants from one submission (Phase 2 feature)

## Shot Style Options
Default: Clean Hero — food fills frame, no props, neutral background

**Clean Hero:**
- Food fills 80%+ of frame
- Dark neutral background (slate, black, dark wood)
- No decorative props
- Best for: DoorDash, UberEats, Grubhub, print menus
- Prompt: "isolated hero shot, food fills frame, clean dark background, no props"

**Lifestyle Scene:**
- Wider shot, styled with context
- Complementary props: chopsticks, sauce dishes, fresh herbs, linen, drink
- Warm atmospheric lighting, slightly bokeh background
- Best for: Instagram, website hero, Facebook ads
- Prompt: "lifestyle food photography, styled scene, complementary props, atmospheric"

## Wizard Step 5 Addition
Add shot style toggle after style selection:
- Clean Hero (default, checked)
- Lifestyle Scene
- Both (+1 credit)

Auto-suggest based on platform selection:
- DD/UE/GH selected → suggest Clean Hero
- Instagram/Website selected → suggest Lifestyle Scene

## "Supporting Role" Shot Type
For: low-price add-ons, sides, soups, appetizers, drinks
Purpose: sell the experience, not the item

When to use:
- Item is minimal/simple (miso soup, edamame, side salad, house soup)
- Item is an upsell/add-on (under $6)
- Hero shot would oversell and create expectation mismatch

Visual approach:
- Hand or spoon interaction with the item (hand lifting spoon, chopsticks picking up)
- Signature/hero dish soft-focused in background
- Warm, intimate lighting — feels like you're at the table
- Item is beautiful but clearly secondary to the scene

Prompt template:
"Lifestyle food photography, [item] shown in natural dining context. 
[Hand detail — e.g. wooden spoon lifting broth, tofu visible on spoon]. 
Soft-focus [hero dish] in background. Warm intimate restaurant lighting, 
shallow depth of field. Steam rising. Feels like mid-meal, 
authentic Japanese dining experience."

## Wizard Logic — Auto-detect Supporting Role
If item price < $7 OR dish type = "soup/side/appetizer" AND cuisine = Japanese:
→ Suggest "Supporting Role" shot with explanation
→ Ask: "What's your signature dish? We'll feature it in the background"

## PlateAI Image Lifecycle (Product Vision)
Stage 1 — Generate: Still photo (Enhanced or AI) → delivery platforms, menu, website
Stage 2 — Animate: Best photo → I2V hero video (8s) → website hero, Reels opener
Stage 3 — Extend & Clip: Hero video → platform cuts (15s TikTok, 30s Reel, 6s bumper, 15s FB ad)
Stage 4 — Campaign: Full ad creative package with copy + targeting (Studio tier)

Upsell flow: Photo → "Turn this into a video" → "Cut it for social" → "Run it as an ad"
Same pipeline as Time Trek (concept art → video → extend)
