// src/lib/types.ts

export type CouponType = 'general' | 'package-specific' | 'category';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: CouponType;
  discountPercentage: number;
  packageId?: string;
  categoryId?: string;
}

export interface PremiumResult {
  basePremium: number;
  totalCoverage: number;
  finalPremium: number;
  monthly: number;
  quarterly: number;
  semiAnnual: number;
  annual: number;
}

export interface CartEntry {
  id: string;
  packageName: string;
  startAge: number;
  endAge: number;
  premium: PremiumResult;
  dateAdded: string;
}

export interface PremiumInfo {
  annual: number;
  monthly?: number;
  quarterly?: number;
  semiAnnual?: number;
}

export interface CalculatorData {
  gender: string;
  currentAge: string;
  coverageAge: string;
  paymentFrequency: string;
  plans: string[];
  packages: string[];
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  basePremium: number;
}

export interface SelectedPackage {
  id: string;
  name: string;
  category: string;
  subPackages?: string[];
  selectedPlans: {
    planId: string;
    planName: string;
    coverage: string;
    units: number;
    monthlyPremium: number;
    annualPremium: number;
  }[];
}