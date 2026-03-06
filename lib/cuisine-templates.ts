export interface CuisineQuestion {
  id: string;
  question: string;
  type: "boolean" | "select" | "multi";
  options?: string[];
  promptKey: string;
}

export interface CuisineTemplate {
  id: string;
  label: string;
  cuisines: string[];
  questions: CuisineQuestion[];
  basePromptContext: string;
}

export const CUISINE_TEMPLATES: CuisineTemplate[] = [
  {
    id: "thai-stir-fry",
    label: "Thai Stir-Fry",
    cuisines: ["Thai / Vietnamese / Southeast Asian"],
    basePromptContext:
      "vibrant Thai stir-fry, wok-charred edges, glossy sauce coating",
    questions: [
      {
        id: "rice",
        question: "Does it come with rice?",
        type: "select",
        options: ["jasmine rice", "fried rice", "sticky rice", "no rice"],
        promptKey: "served with",
      },
      {
        id: "fried-egg",
        question: "Topped with a fried egg?",
        type: "boolean",
        promptKey: "topped with one crispy fried egg, runny yolk",
      },
      {
        id: "protein",
        question: "Protein",
        type: "select",
        options: ["chicken", "beef", "pork", "shrimp", "tofu"],
        promptKey: "protein",
      },
      {
        id: "heat",
        question: "Heat visible?",
        type: "boolean",
        promptKey:
          "fresh sliced red chilis and chili oil drizzle visible",
      },
      {
        id: "herbs",
        question: "Fresh herb garnish?",
        type: "boolean",
        promptKey: "fresh Thai basil leaves scattered on top",
      },
    ],
  },
  {
    id: "ramen-noodle-soup",
    label: "Ramen & Noodle Soup",
    cuisines: [
      "Asian / Japanese / Sushi",
      "Thai / Vietnamese / Southeast Asian",
    ],
    basePromptContext:
      "steaming bowl of noodle soup, rich broth with slight sheen",
    questions: [
      {
        id: "broth",
        question: "Broth type",
        type: "select",
        options: [
          "tonkotsu cloudy pork",
          "shoyu clear soy",
          "miso",
          "spicy red",
          "clear Thai",
        ],
        promptKey: "broth style",
      },
      {
        id: "egg",
        question: "Soft-boiled egg?",
        type: "boolean",
        promptKey:
          "soft-boiled marinated egg halved with jammy orange yolk facing camera",
      },
      {
        id: "nori",
        question: "Nori sheet?",
        type: "boolean",
        promptKey:
          "nori sheet standing upright propped against inner bowl rim",
      },
      {
        id: "chashu",
        question: "Chashu pork?",
        type: "boolean",
        promptKey: "2 slices of chashu pork fanned out",
      },
      {
        id: "toppings",
        question: "Additional toppings",
        type: "multi",
        options: [
          "bamboo shoots",
          "corn",
          "butter pat",
          "bean sprouts",
          "menma",
        ],
        promptKey: "additional toppings",
      },
      {
        id: "bowl",
        question: "Bowl style",
        type: "select",
        options: [
          "dark ceramic",
          "white ceramic",
          "traditional Japanese lacquer",
        ],
        promptKey: "served in",
      },
    ],
  },
  {
    id: "clear-broth-soup",
    label: "Clear Broth Soup",
    cuisines: [
      "Asian / Japanese / Sushi",
      "Thai / Vietnamese / Southeast Asian",
      "American / Comfort Food",
    ],
    basePromptContext:
      "steaming clear broth soup, warm golden liquid, gentle steam",
    questions: [
      {
        id: "broth-color",
        question: "Broth color",
        type: "select",
        options: ["golden", "clear", "slightly amber", "white/milky"],
        promptKey: "broth color",
      },
      {
        id: "protein",
        question: "Main protein",
        type: "select",
        options: [
          "wontons",
          "dumplings",
          "chicken",
          "beef",
          "pork",
          "shrimp",
          "tofu",
        ],
        promptKey: "main protein",
      },
      {
        id: "garnish",
        question: "Garnish",
        type: "multi",
        options: [
          "scallions",
          "cilantro",
          "fried garlic",
          "bean sprouts",
          "carrots",
        ],
        promptKey: "garnished with",
      },
      {
        id: "bowl",
        question: "Bowl style",
        type: "select",
        options: ["dark ceramic", "white ceramic", "traditional Asian"],
        promptKey: "served in",
      },
    ],
  },
  {
    id: "sushi-rolls",
    label: "Sushi & Rolls",
    cuisines: ["Asian / Japanese / Sushi"],
    basePromptContext:
      "precision sushi plating, glistening fresh fish, clean presentation",
    questions: [
      {
        id: "roll-type",
        question: "Roll type",
        type: "select",
        options: [
          "inside-out (uramaki)",
          "traditional (hosomaki)",
          "hand roll",
          "nigiri",
          "sashimi",
        ],
        promptKey: "style",
      },
      {
        id: "sauce",
        question: "Sauce drizzle",
        type: "multi",
        options: ["eel sauce", "spicy mayo", "ponzu", "none"],
        promptKey: "drizzled with",
      },
      {
        id: "garnish",
        question: "Garnish",
        type: "multi",
        options: [
          "sesame seeds",
          "tobiko",
          "microgreens",
          "shiso leaf",
          "none",
        ],
        promptKey: "garnished with",
      },
      {
        id: "plate",
        question: "Plate style",
        type: "select",
        options: [
          "dark slate",
          "white ceramic",
          "bamboo mat",
          "wooden board",
        ],
        promptKey: "served on",
      },
      {
        id: "sides",
        question: "Ginger & wasabi on side?",
        type: "boolean",
        promptKey:
          "small mound of pickled ginger and wasabi on side of plate",
      },
    ],
  },
  {
    id: "thai-curry",
    label: "Thai Curry",
    cuisines: ["Thai / Vietnamese / Southeast Asian"],
    basePromptContext:
      "rich creamy Thai curry, vibrant sauce, aromatic",
    questions: [
      {
        id: "curry-type",
        question: "Curry type",
        type: "select",
        options: ["green", "red", "yellow", "massaman", "panang"],
        promptKey: "curry style",
      },
      {
        id: "served-with",
        question: "Served with",
        type: "select",
        options: [
          "jasmine rice (side)",
          "rice in bowl",
          "roti bread",
          "noodles",
        ],
        promptKey: "served with",
      },
      {
        id: "protein",
        question: "Protein",
        type: "select",
        options: [
          "chicken",
          "beef",
          "pork",
          "shrimp",
          "tofu",
          "mixed seafood",
        ],
        promptKey: "protein",
      },
      {
        id: "coconut",
        question: "Coconut cream swirl on top?",
        type: "boolean",
        promptKey: "elegant coconut cream swirl on surface",
      },
      {
        id: "garnish",
        question: "Fresh garnish",
        type: "multi",
        options: [
          "Thai basil",
          "kaffir lime leaves",
          "sliced chili",
          "none",
        ],
        promptKey: "garnished with",
      },
      {
        id: "bowl",
        question: "Bowl style",
        type: "select",
        options: [
          "dark ceramic",
          "white ceramic",
          "traditional Thai clay pot",
        ],
        promptKey: "served in",
      },
    ],
  },
  {
    id: "stir-fry-general",
    label: "Stir-Fry (General Asian)",
    cuisines: [
      "Asian / Japanese / Sushi",
      "Thai / Vietnamese / Southeast Asian",
    ],
    basePromptContext:
      "wok-tossed stir-fry, glossy sauce, high heat char",
    questions: [
      {
        id: "served-with",
        question: "Served with",
        type: "select",
        options: [
          "jasmine rice",
          "fried rice",
          "noodles",
          "on its own",
        ],
        promptKey: "served with",
      },
      {
        id: "protein",
        question: "Protein",
        type: "select",
        options: ["chicken", "beef", "pork", "shrimp", "tofu", "mixed"],
        promptKey: "protein",
      },
      {
        id: "vegetables",
        question: "Vegetables visible",
        type: "multi",
        options: [
          "broccoli",
          "bok choy",
          "bell peppers",
          "snap peas",
          "mushrooms",
          "onions",
          "carrots",
        ],
        promptKey: "with visible",
      },
      {
        id: "sauce",
        question: "Sauce type",
        type: "select",
        options: [
          "oyster sauce",
          "teriyaki",
          "black bean",
          "garlic sauce",
          "spicy basil",
        ],
        promptKey: "sauce style",
      },
    ],
  },
  {
    id: "italian-mediterranean",
    label: "Italian / Mediterranean",
    cuisines: ["Italian / Mediterranean"],
    basePromptContext:
      "rustic Italian plating, fresh ingredients, warm tones",
    questions: [
      {
        id: "dish-type",
        question: "Dish type",
        type: "select",
        options: [
          "pasta",
          "pizza",
          "risotto",
          "salad",
          "protein main",
        ],
        promptKey: "dish type",
      },
      {
        id: "herbs",
        question: "Fresh herbs on top?",
        type: "boolean",
        promptKey: "fresh basil or parsley scattered on top",
      },
      {
        id: "parmesan",
        question: "Parmesan?",
        type: "boolean",
        promptKey: "freshly grated parmesan cheese",
      },
      {
        id: "plate",
        question: "Plate style",
        type: "select",
        options: [
          "white ceramic",
          "rustic terracotta",
          "slate board",
        ],
        promptKey: "served on",
      },
      {
        id: "sauce",
        question: "Sauce visible?",
        type: "boolean",
        promptKey: "visible sauce on plate",
      },
    ],
  },
  {
    id: "american-comfort",
    label: "American / Comfort",
    cuisines: ["American / Comfort Food", "Steakhouse / Wood-fired"],
    basePromptContext:
      "hearty American comfort food, generous portion, inviting",
    questions: [
      {
        id: "dish-type",
        question: "Dish type",
        type: "select",
        options: [
          "burger",
          "steak",
          "ribs",
          "sandwich",
          "bowl",
          "wings",
          "fries",
        ],
        promptKey: "dish type",
      },
      {
        id: "sides",
        question: "Served with sides?",
        type: "multi",
        options: [
          "fries",
          "coleslaw",
          "salad",
          "mashed potato",
          "onion rings",
        ],
        promptKey: "served with",
      },
      {
        id: "sauce",
        question: "Sauce visible?",
        type: "boolean",
        promptKey: "drizzle or pool of sauce",
      },
      {
        id: "plate",
        question: "Plate style",
        type: "select",
        options: [
          "white ceramic",
          "slate board",
          "cast iron skillet",
          "parchment-lined basket",
        ],
        promptKey: "served on",
      },
      {
        id: "garnish",
        question: "Garnish",
        type: "multi",
        options: [
          "fresh herbs",
          "pickles",
          "lemon wedge",
          "none",
        ],
        promptKey: "garnished with",
      },
    ],
  },
  {
    id: "seafood-raw-bar",
    label: "Seafood / Raw Bar",
    cuisines: ["Seafood / Raw Bar"],
    basePromptContext:
      "fresh premium seafood, glistening, ocean-fresh presentation",
    questions: [
      {
        id: "dish-type",
        question: "Dish type",
        type: "select",
        options: [
          "oysters",
          "crab legs",
          "shrimp cocktail",
          "lobster",
          "fish fillet",
          "carpaccio",
          "tower",
        ],
        promptKey: "dish type",
      },
      {
        id: "ice",
        question: "On ice?",
        type: "boolean",
        promptKey: "displayed on crushed ice",
      },
      {
        id: "lemon",
        question: "Lemon wedges?",
        type: "boolean",
        promptKey: "fresh lemon wedges alongside",
      },
      {
        id: "sauce",
        question: "Sauce/accompaniment",
        type: "multi",
        options: [
          "mignonette",
          "cocktail sauce",
          "aioli",
          "drawn butter",
          "none",
        ],
        promptKey: "accompanied by",
      },
      {
        id: "plate",
        question: "Plate style",
        type: "select",
        options: [
          "white ceramic",
          "slate",
          "seafood tower stand",
          "raw bar presentation",
        ],
        promptKey: "served on",
      },
    ],
  },
];

export const CUISINE_OPTIONS = [
  "American / Comfort Food",
  "Italian / Mediterranean",
  "Asian / Japanese / Sushi",
  "Thai / Vietnamese / Southeast Asian",
  "Mexican / Latin",
  "Seafood / Raw Bar",
  "Steakhouse / Wood-fired",
  "Bakery / Cafe",
  "Other",
];

export function getTemplatesForCuisine(
  cuisine: string
): CuisineTemplate[] {
  return CUISINE_TEMPLATES.filter((t) => t.cuisines.includes(cuisine));
}
