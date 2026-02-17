import type { SpendProfile } from "../types/spend";

export const defaultMonthlySpend: Record<string, number> = {
  groceries: 600,
  gas: 180,
  dining: 320,
  travel: 200,
  "online-shopping": 220,
  entertainment: 110,
  "bills-utilities": 360,
  "drugstores-pharmacy": 60,
  "home-improvement": 90,
  "office-supplies": 30,
  "gym-fitness": 40,
  pet: 50,
  "childcare-education": 180,
  medical: 120,
  clothing: 100,
  electronics: 70,
  other: 700,
};

export const defaultSpendProfile: SpendProfile = {
  id: "default-spend",
  name: "Average Household",
  monthlySpend: defaultMonthlySpend,
};
