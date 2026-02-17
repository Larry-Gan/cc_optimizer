export interface Portfolio {
  id: string;
  name: string;
  cardIds: string[];
  categoryAssignments: Record<string, string>;
  createdAt: string;
  source: "manual" | "optimizer" | "imported";
}

export type OptimizationTarget =
  | "monthly_cashback"
  | "annual_net_value"
  | "first_year_value";

export interface PortfolioScore {
  monthlyCashback: number;
  annualCashback: number;
  annualFees: number;
  annualPerks: number;
  signOnValue: number;
  netAnnualValue: number;
  firstYearValue: number;
}
