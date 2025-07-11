export interface PricingTier {
  ageFrom: number;
  ageTo: number;
  price: number;
}

export interface PremiumResult {
  total: number;         // หากมีมากกว่า 1 ปีจะคิดรวม
  annual: number;        
  semiAnnual: number;    
  quarterly: number;     
  monthly: number;       
}

export const calculateTieredPremium = (
  startAge: number,
  endAge: number,
  tiers: PricingTier[]
): PremiumResult => {
  let total = 0;
  let totalYears = 0;

  for (const tier of tiers) {
    const overlapStart = Math.max(startAge, tier.ageFrom);
    const overlapEnd = Math.min(endAge, tier.ageTo);
    const yearsInTier = overlapEnd - overlapStart + 1;

    if (yearsInTier > 0) {
      total += tier.price * yearsInTier;
      totalYears += yearsInTier;
    }
  }

  const annual = totalYears > 0 ? total / totalYears : 0;

  return {
    total,
    annual: Math.round(annual),
    semiAnnual: Math.round(annual / 2),
    quarterly: Math.round(annual / 4),
    monthly: Math.round(annual / 12),
  };
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