import { CUISINE_TEMPLATES, type CuisineQuestion } from "./cuisine-templates";

interface GenerationConfig {
  dishName: string;
  ingredients: string[];
  style: string | null;
  platforms: string[];
  resolution: string | null;
  cuisine?: string;
  cuisineContext?: Record<string, string | string[] | boolean>;
  selectedTemplate?: string;
}

const STYLE_RULES: Record<string, string> = {
  enhanced:
    "Enhance the existing photo: deepen colors, improve lighting balance, clean background, boost appetizing appeal while keeping composition intact.",
  generated:
    "Full AI generation from scratch. Photorealistic studio food photography, professional lighting setup with key light and fill, shallow depth of field.",
  michelin:
    "Fine-dining Michelin-star plating. Architectural precision, negative space, artistic sauce swooshes, tweezered microgreens, aspirational presentation.",
  xray:
    "3D transparent cutaway view showing every internal layer. Cross-section revealing fillings, layers, and textures inside the dish. Dramatic studio lighting.",
  slice:
    "A clean wedge removed from the dish revealing the interior cross-section. Sharp cut edge showing internal layers, textures, and fillings. Satisfying food cross-section.",
};

const PLATFORM_GUIDANCE: Record<string, string> = {
  doordash: "tight crop, high saturation, appetizing on small screens",
  ubereats: "clean composition, bright lighting, white-friendly background",
  grubhub: "centered dish, clear edges, good at reduced size",
  google: "square format, well-lit, recognizable dish",
  website: "wide hero crop, lifestyle elements, premium feel",
  instagram: "square, vibrant, scroll-stopping, social media aesthetic",
  print: "ultra high resolution, precise color, print-ready sharpness",
};

const RESOLUTION_MAP: Record<string, string> = {
  "1k": "1024x1024",
  "2k": "2048x2048",
  "4k": "4096x4096",
};

export function buildPrompt(config: GenerationConfig): string {
  const parts: string[] = [];

  // 1. Base description
  parts.push(`Professional food photograph of "${config.dishName}".`);

  // 2. Cuisine template base context
  if (config.selectedTemplate) {
    const template = CUISINE_TEMPLATES.find(
      (t) => t.id === config.selectedTemplate
    );
    if (template) {
      parts.push(template.basePromptContext + ".");
    }
  }

  // 3. Confirmed ingredients
  if (config.ingredients.length > 0) {
    parts.push(
      `Dish contains: ${config.ingredients.join(", ")}.`
    );
  }

  // 4. Cuisine template context answers
  if (config.cuisineContext && config.selectedTemplate) {
    const template = CUISINE_TEMPLATES.find(
      (t) => t.id === config.selectedTemplate
    );
    if (template) {
      const contextParts: string[] = [];
      for (const q of template.questions) {
        const answer = config.cuisineContext[q.id];
        if (answer === undefined || answer === false) continue;

        if (q.type === "boolean" && answer === true) {
          contextParts.push(q.promptKey);
        } else if (q.type === "select" && typeof answer === "string") {
          contextParts.push(`${q.promptKey}: ${answer}`);
        } else if (q.type === "multi" && Array.isArray(answer) && answer.length > 0) {
          const filtered = (answer as string[]).filter(
            (v) => v !== "none"
          );
          if (filtered.length > 0) {
            contextParts.push(
              `${q.promptKey} ${filtered.join(", ")}`
            );
          }
        }
      }
      if (contextParts.length > 0) {
        parts.push(`Shown with: ${contextParts.join(". ")}.`);
      }
    }
  }

  // 5. Shot style rules
  if (config.style && STYLE_RULES[config.style]) {
    parts.push(STYLE_RULES[config.style]);
  }

  // 6. Platform-specific guidance
  if (config.platforms.length > 0) {
    const guides = config.platforms
      .map((p) => PLATFORM_GUIDANCE[p])
      .filter(Boolean);
    if (guides.length > 0) {
      parts.push(`Optimize for: ${guides.join("; ")}.`);
    }
  }

  // 7. Resolution & closing
  const res = config.resolution
    ? RESOLUTION_MAP[config.resolution] || "1024x1024"
    : "1024x1024";
  parts.push(
    `Photorealistic, restaurant menu quality, ${res}.`
  );

  return parts.join(" ");
}
