# PlateAI — Cuisine-Aware Prompt Templates

## Overview
Add a cuisine template system to the generation wizard. When a customer selects 
cuisine type, the wizard auto-loads smart contextual questions that pre-populate 
the ingredient and context fields — same quality questions a professional food 
photographer would ask.

---

## File to create: `lib/cuisine-templates.ts`

Export a `CUISINE_TEMPLATES` object with this structure:

```typescript
interface CuisineQuestion {
  id: string;
  question: string;
  type: "boolean" | "select" | "multi";
  options?: string[];
  promptKey: string; // injected into generation prompt
}

interface CuisineTemplate {
  id: string;
  label: string;
  cuisines: string[]; // matches from wizard Step 1 cuisine selection
  questions: CuisineQuestion[];
  basePromptContext: string; // always added for this cuisine
}
```

Include these templates:

### Thai Stir-Fry
```
cuisines: ["Thai / Vietnamese / Southeast Asian"]
basePromptContext: "vibrant Thai stir-fry, wok-charred edges, glossy sauce coating"
questions:
  - Does it come with rice? → select: jasmine rice / fried rice / sticky rice / no rice
  - Topped with a fried egg? → boolean → "topped with one crispy fried egg, runny yolk"
  - Protein → select: chicken / beef / pork / shrimp / tofu
  - Heat visible? → boolean → "fresh sliced red chilis and chili oil drizzle visible"
  - Fresh herb garnish? → boolean → "fresh Thai basil leaves scattered on top"
```

### Ramen & Noodle Soup
```
cuisines: ["Asian / Japanese / Sushi", "Thai / Vietnamese / Southeast Asian"]
basePromptContext: "steaming bowl of noodle soup, rich broth with slight sheen"
questions:
  - Broth type → select: tonkotsu cloudy pork / shoyu clear soy / miso / spicy red / clear Thai
  - Soft-boiled egg? → boolean → "soft-boiled marinated egg halved with jammy orange yolk facing camera"
  - Nori sheet? → boolean → "nori sheet standing upright propped against inner bowl rim"
  - Chashu pork? → boolean → "2 slices of chashu pork fanned out"
  - Additional toppings → multi: bamboo shoots / corn / butter pat / bean sprouts / menma
  - Bowl style → select: dark ceramic / white ceramic / traditional Japanese lacquer
```

### Clear Broth Soup
```
cuisines: ["Asian / Japanese / Sushi", "Thai / Vietnamese / Southeast Asian", "American / Comfort Food"]
basePromptContext: "steaming clear broth soup, warm golden liquid, gentle steam"
questions:
  - Broth color → select: golden / clear / slightly amber / white/milky
  - Main protein → select: wontons / dumplings / chicken / beef / pork / shrimp / tofu
  - Garnish → multi: scallions / cilantro / fried garlic / bean sprouts / carrots
  - Bowl style → select: dark ceramic / white ceramic / traditional Asian
```

### Sushi & Rolls
```
cuisines: ["Asian / Japanese / Sushi"]
basePromptContext: "precision sushi plating, glistening fresh fish, clean presentation"
questions:
  - Roll type → select: inside-out (uramaki) / traditional (hosomaki) / hand roll / nigiri / sashimi
  - Sauce drizzle → multi: eel sauce / spicy mayo / ponzu / none
  - Garnish → multi: sesame seeds / tobiko / microgreens / shiso leaf / none
  - Plate style → select: dark slate / white ceramic / bamboo mat / wooden board
  - Ginger & wasabi on side? → boolean → "small mound of pickled ginger and wasabi on side of plate"
```

### Thai Curry
```
cuisines: ["Thai / Vietnamese / Southeast Asian"]
basePromptContext: "rich creamy Thai curry, vibrant sauce, aromatic"
questions:
  - Curry type → select: green / red / yellow / massaman / panang
  - Served with → select: jasmine rice (side) / rice in bowl / roti bread / noodles
  - Protein → select: chicken / beef / pork / shrimp / tofu / mixed seafood
  - Coconut cream swirl on top? → boolean → "elegant coconut cream swirl on surface"
  - Fresh garnish → multi: Thai basil / kaffir lime leaves / sliced chili / none
  - Bowl style → select: dark ceramic / white ceramic / traditional Thai clay pot
```

### Stir-Fry (General Asian)
```
cuisines: ["Asian / Japanese / Sushi", "Thai / Vietnamese / Southeast Asian"]
basePromptContext: "wok-tossed stir-fry, glossy sauce, high heat char"
questions:
  - Served with → select: jasmine rice / fried rice / noodles / on its own
  - Protein → select: chicken / beef / pork / shrimp / tofu / mixed
  - Vegetables visible → multi: broccoli / bok choy / bell peppers / snap peas / mushrooms / onions / carrots
  - Sauce type → select: oyster sauce / teriyaki / black bean / garlic sauce / spicy basil
```

### Italian / Mediterranean
```
cuisines: ["Italian / Mediterranean"]
basePromptContext: "rustic Italian plating, fresh ingredients, warm tones"
questions:
  - Dish type → select: pasta / pizza / risotto / salad / protein main
  - Fresh herbs on top? → boolean → "fresh basil or parsley scattered on top"
  - Parmesan? → boolean → "freshly grated parmesan cheese"
  - Plate style → select: white ceramic / rustic terracotta / slate board
  - Sauce visible? → boolean → describe sauce type
```

### American / Comfort
```
cuisines: ["American / Comfort Food", "Steakhouse / Wood-fired"]
basePromptContext: "hearty American comfort food, generous portion, inviting"
questions:
  - Dish type → select: burger / steak / ribs / sandwich / bowl / wings / fries
  - Served with sides? → boolean + multi: fries / coleslaw / salad / mashed potato / onion rings
  - Sauce visible? → boolean → drizzle or pool of sauce
  - Plate style → select: white ceramic / slate board / cast iron skillet / parchment-lined basket
  - Garnish → multi: fresh herbs / pickles / lemon wedge / none
```

### Seafood / Raw Bar
```
cuisines: ["Seafood / Raw Bar"]
basePromptContext: "fresh premium seafood, glistening, ocean-fresh presentation"
questions:
  - Dish type → select: oysters / crab legs / shrimp cocktail / lobster / fish fillet / carpaccio / tower
  - On ice? → boolean → "displayed on crushed ice"
  - Lemon wedges? → boolean → "fresh lemon wedges alongside"
  - Sauce/accompaniment → multi: mignonette / cocktail sauce / aioli / drawn butter / none
  - Plate style → select: white ceramic / slate / seafood tower stand / raw bar presentation
```

---

## Wizard Integration

### Update `app/generate/page.tsx`

After Step 1 (dish name) and Step 2 (existing photo), add a new **Step 1b** that appears only if cuisine was selected:

Actually — integrate into **Step 4 (Confirm Ingredients)**:

After the basic ingredient tag list, add a collapsible section:
**"Smart suggestions for [Cuisine Type]"**

Show the relevant template questions as quick-tap chips.
Each selected option:
1. Adds to the ingredient/context list with a 🍽️ tag (to distinguish from core ingredients)
2. Gets injected into the prompt as contextual guidance

Store template answers in `cuisineContext: Record<string, string | string[] | boolean>` in the generation config.

**Auto-inject into prompt:**
Build a `buildPrompt(config)` utility in `lib/prompt-builder.ts` that:
1. Starts with base description
2. Adds all confirmed ingredients
3. Adds cuisine template context
4. Adds optional ingredients (with "shown with..." prefix)
5. Adds shot style rules
6. Adds serveware specification
7. Adds platform-specific guidance (tight crop vs lifestyle)
8. Ends with: "Photorealistic, restaurant menu quality, [aspect ratio]"

---

## Build & verify
`pnpm build` — fix TypeScript errors.
Do NOT deploy.

When finished run:
openclaw system event --text "Done: PlateAI cuisine templates + prompt builder built" --mode now
