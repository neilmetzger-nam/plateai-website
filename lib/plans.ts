export const PLANS = {
  starter: {
    name: "Starter",
    price: 29.95,
    credits: 20,
    features: [
      "10 menu items/mo",
      "Hero shot — menu & website ready",
      "Commercial lighting & styling",
      "Download in full resolution",
      "Cancel anytime",
    ],
    squareItemVariationId: process.env.SQUARE_ITEM_STARTER!,
  },
  pro: {
    name: "Pro",
    price: 99,
    credits: 60,
    features: [
      "30 menu items/mo",
      "Hero + Lifestyle + Action shots",
      "3 commercial photos per item",
      "Social media ready (Instagram, TikTok)",
      "Brand name on packaging",
      "Cancel anytime",
    ],
    squareItemVariationId: process.env.SQUARE_ITEM_PRO!,
    popular: true,
  },
  studio: {
    name: "Studio",
    price: 199,
    credits: 999,
    features: [
      "Unlimited menu items",
      "Hero + Lifestyle + Action shots",
      "Video commercial per item",
      "Your location as backdrop",
      "Brand name on all assets",
      "Priority processing",
    ],
    squareItemVariationId: process.env.SQUARE_ITEM_STUDIO!,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
