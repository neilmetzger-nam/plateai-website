export const PLANS = {
  starter: {
    name: "Starter",
    price: 49,
    credits: 20,
    features: [
      "10 photos/mo",
      "Enhanced + Generated styles",
      "1K resolution",
      "All 7 platforms",
    ],
    squareItemVariationId: process.env.SQUARE_ITEM_STARTER!,
  },
  pro: {
    name: "Pro",
    price: 99,
    credits: 60,
    features: [
      "30 photos/mo",
      "All styles incl. Michelin, X-Ray, Slice",
      "2K resolution",
      "Hero videos",
      "Social clips",
    ],
    squareItemVariationId: process.env.SQUARE_ITEM_PRO!,
    popular: true,
  },
  studio: {
    name: "Studio",
    price: 199,
    credits: 999,
    features: [
      "Unlimited photos",
      "Unlimited videos",
      "4K resolution",
      "Ad creative packs",
      "Priority generation",
    ],
    squareItemVariationId: process.env.SQUARE_ITEM_STUDIO!,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
