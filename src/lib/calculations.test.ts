import { scorePortfolio } from "./calculations";
import type { Card } from "../types/card";

const baseCard = {
  id: "flat-2",
  name: "Flat 2",
  issuer: "Test",
  network: "Visa",
  cardType: "credit",
  annualFee: 0,
  foreignTransactionFeePercent: 0,
  isActive: true,
  baseCashbackPercent: 2,
  categoryBonuses: [],
  pointsSystem: { programName: null, defaultPointValueCents: 1, userPointValueCents: null },
  signOnBonus: null,
  perks: [],
  exclusivityRules: [],
  conditionalBonuses: [],
  paymentMethodBonuses: [],
  merchantCategoryOverrides: [],
  notes: "",
  url: null,
  lastUpdated: "2026-01-01",
} satisfies Card;

test("scorePortfolio uses best card per category and computes annual summary", () => {
  const groceryCard: Card = {
    ...baseCard,
    id: "grocery-6",
    name: "Grocery 6",
    baseCashbackPercent: 1,
    categoryBonuses: [
      {
        categoryId: "groceries",
        cashbackPercent: 6,
        spendLimit: { amount: 6000, period: "year" },
        isUserChoosable: false,
        maxChoosableSlots: null,
        isRotating: false,
        rotatingSchedule: null,
        notes: "",
      },
    ],
    annualFee: 95,
  };

  const scored = scorePortfolio(
    [baseCard, groceryCard],
    { groceries: 600, dining: 300, other: 1000 },
    false,
  );

  expect(scored.score.monthlyCashback).toBeGreaterThan(40);
  expect(scored.score.annualCashback).toBeCloseTo(scored.score.monthlyCashback * 12, 4);
  expect(scored.score.annualFees).toBe(95);
  expect(scored.allocation.find((row) => row.categoryId === "groceries")?.cardId).toBe("grocery-6");
});

test("scorePortfolio returns zero values when no cards are selected", () => {
  const scored = scorePortfolio([], { groceries: 600, dining: 300, other: 1000 }, true);

  expect(scored.score.monthlyCashback).toBe(0);
  expect(scored.score.annualCashback).toBe(0);
  expect(scored.score.annualFees).toBe(0);
  expect(scored.score.annualPerks).toBe(0);
  expect(scored.score.signOnValue).toBe(0);
  expect(scored.score.netAnnualValue).toBe(0);
  expect(scored.score.firstYearValue).toBe(0);
  expect(scored.allocation).toEqual([]);
});

test("scorePortfolio supports current-quarter rotating behavior", () => {
  const rotatingCard: Card = {
    ...baseCard,
    id: "rotating",
    name: "Rotating",
    baseCashbackPercent: 1,
    categoryBonuses: [
      {
        categoryId: "groceries",
        cashbackPercent: 5,
        spendLimit: { amount: null, period: null },
        isUserChoosable: false,
        maxChoosableSlots: null,
        isRotating: true,
        rotatingSchedule: {
          Q1: ["groceries"],
          Q2: ["gas"],
          Q3: ["dining"],
          Q4: ["travel"],
        },
        notes: "",
      },
    ],
  };

  const annualized = scorePortfolio(
    [rotatingCard],
    { groceries: 400 },
    false,
    { rotatingMode: "annualized", currentQuarter: "Q2" },
  );
  const currentQuarter = scorePortfolio(
    [rotatingCard],
    { groceries: 400 },
    false,
    { rotatingMode: "current_quarter", currentQuarter: "Q2" },
  );

  expect(annualized.score.monthlyCashback).toBeCloseTo(5, 4);
  expect(currentQuarter.score.monthlyCashback).toBeCloseTo(4, 4);
});

test("scorePortfolio respects network-restricted categories", () => {
  const mcCard: Card = {
    ...baseCard,
    id: "mc-flat",
    name: "MC Flat",
    network: "Mastercard",
  };
  const visaCard: Card = {
    ...baseCard,
    id: "visa-flat",
    name: "Visa Flat",
    network: "Visa",
  };

  const scoredWithMcOnly = scorePortfolio([mcCard], { "costco-gas": 200 }, false);
  const scoredWithVisa = scorePortfolio([mcCard, visaCard], { "costco-gas": 200 }, false);

  expect(scoredWithMcOnly.score.monthlyCashback).toBe(0);
  expect(scoredWithVisa.score.monthlyCashback).toBeGreaterThan(0);
  expect(scoredWithMcOnly.allocation[0].cardId).toBe("unassigned");
});
