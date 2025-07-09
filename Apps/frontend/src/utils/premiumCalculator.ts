export interface PricingTier {
  ageFrom: number;
  ageTo: number;
  price: number;
}

export const calculateTieredPremium = (
  startAge: number,
  endAge: number,
  tiers: PricingTier[]
): number => {
  let total = 0;

  for (const tier of tiers) {
    const overlapStart = Math.max(startAge, tier.ageFrom);
    const overlapEnd = Math.min(endAge, tier.ageTo);
    const yearsInTier = overlapEnd - overlapStart + 1;

    if (yearsInTier > 0) {
      total += tier.price * yearsInTier;
    }
  }

  return total;
};

export const getPricingTiersFromPackage = (
  pkg: any,
  gender: 'male' | 'female'
): PricingTier[] => {
  if (!pkg?.pricing || !Array.isArray(pkg.pricing)) return [];

  return pkg.pricing
    .filter((p: any) => p[gender] != null)
    .map((p: any) => ({
      ageFrom: p.ageFrom,
      ageTo: p.ageTo,
      price: p[gender],
    }));
};