export const CREDIT_COST = { photo: 2, video: 5, social_cut: 1 };

export function creditsForGeneration(config: {
  variations: number;
  addVideo: boolean;
}) {
  return (
    config.variations * CREDIT_COST.photo +
    (config.addVideo ? CREDIT_COST.video : 0)
  );
}
