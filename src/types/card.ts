export type Network = "Visa" | "Mastercard" | "Amex" | "Discover";
export type CardType = "credit" | "debit";
export type SpendPeriod = "month" | "quarter" | "year";

export interface SpendLimit {
  amount: number | null;
  period: SpendPeriod | null;
}

export interface CategoryBonus {
  categoryId: string;
  cashbackPercent: number;
  spendLimit: SpendLimit;
  isUserChoosable: boolean;
  maxChoosableSlots: number | null;
  allowedCategoryIds?: string[];
  isRotating: boolean;
  rotatingSchedule: Record<string, string[]> | null;
  notes: string;
}

export interface PointsSystem {
  programName: string | null;
  defaultPointValueCents: number;
  userPointValueCents: number | null;
}

export interface SignOnBonus {
  bonusAmount: number;
  bonusType: "cash" | "points";
  spendRequirement: number;
  timeframeDays: number;
  notes: string;
}

export interface Perk {
  name: string;
  estimatedAnnualValue: number;
  userAnnualValue: number | null;
  notes: string;
}

export interface ExclusivityRule {
  ruleType: "cannot_hold_with" | "one_of_family";
  cardIds: string[];
  notes: string;
}

export interface ConditionalBonus {
  conditionName: string;
  conditionDescription: string;
  baseCashbackBoost: number;
  categoryBonusMultiplier: number;
  isActive: boolean;
}

export interface PaymentMethodBonus {
  method:
    | "apple_pay"
    | "google_pay"
    | "samsung_pay"
    | "contactless"
    | "travel_portal";
  bonusCashbackPercent: number;
  applicableCategories: string[];
  spendLimit: SpendLimit;
  notes: string;
}

export interface MerchantCategoryOverride {
  merchantId: string;
  overrideCategoryId: string;
}

export interface Card {
  id: string;
  name: string;
  issuer: string;
  network: Network;
  cardType: CardType;
  annualFee: number;
  foreignTransactionFeePercent: number;
  isActive: boolean;
  baseCashbackPercent: number;
  categoryBonuses: CategoryBonus[];
  pointsSystem: PointsSystem;
  signOnBonus: SignOnBonus | null;
  perks: Perk[];
  exclusivityRules: ExclusivityRule[];
  conditionalBonuses: ConditionalBonus[];
  paymentMethodBonuses: PaymentMethodBonus[];
  merchantCategoryOverrides: MerchantCategoryOverride[];
  notes: string;
  url: string | null;
  lastUpdated: string;
}
