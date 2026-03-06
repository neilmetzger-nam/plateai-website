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
- Never: add garnishes, change proteins, swap ingredients

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
