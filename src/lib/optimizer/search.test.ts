import type { Card } from "../../types/card";
import { optimizePortfolios } from "./search";

const makeCard = (overrides: Partial<Card>): Card => ({
  id: "base-card",
  name: "Base Card",
  issuer: "Test",
  network: "Visa",
  cardType: "credit",
  annualFee: 0,
  foreignTransactionFeePercent: 0,
  isActive: true,
  baseCashbackPercent: 1,
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
  ...overrides,
});

const baseInput = {
  monthlySpend: { groceries: 500, dining: 300 },
  maxCards: 1,
  cardInclusionModeById: {} as Record<string, "include" | "neutral" | "exclude">,
  target: "monthly_cashback" as const,
  includeSignOnBonusInFirstYear: false,
  rotatingMode: "annualized" as const,
  currentQuarter: "Q1" as const,
};

test("optimizer skips exclusivity-violating forced set", () => {
  const a = makeCard({
    id: "a",
    name: "A",
    exclusivityRules: [{ ruleType: "cannot_hold_with", cardIds: ["b"], notes: "" }],
  });
  const b = makeCard({ id: "b", name: "B" });

  const results = optimizePortfolios({
    ...baseInput,
    cards: [a, b],
    maxCards: 2,
    cardInclusionModeById: { a: "include", b: "include" },
  });

  expect(results).toEqual([]);
});

test("optimizer explores choosable-category variants", () => {
  const chooser = makeCard({
    id: "chooser",
    name: "Chooser",
    baseCashbackPercent: 1,
    categoryBonuses: [
      {
        categoryId: "online-shopping",
        cashbackPercent: 5,
        spendLimit: { amount: null, period: null },
        isUserChoosable: true,
        maxChoosableSlots: 1,
        isRotating: false,
        rotatingSchedule: null,
        notes: "",
      },
    ],
  });
  const flat = makeCard({ id: "flat", name: "Flat", baseCashbackPercent: 2 });

  const results = optimizePortfolios({
    ...baseInput,
    cards: [chooser, flat],
  });

  expect(results.length).toBeGreaterThan(0);
  expect(results[0].cardIds).toContain("chooser");
  expect(results[0].allocation.find((row) => row.categoryId === "groceries")?.ratePercent).toBe(5);
});

test("optimizer respects allowedCategoryIds for chooser cards", () => {
  const chooser = makeCard({
    id: "chooser",
    name: "Chooser",
    baseCashbackPercent: 1,
    categoryBonuses: [
      {
        categoryId: "online-shopping",
        cashbackPercent: 5,
        spendLimit: { amount: null, period: null },
        isUserChoosable: true,
        maxChoosableSlots: 1,
        allowedCategoryIds: ["dining"], // ONLY dining allowed
        isRotating: false,
        rotatingSchedule: null,
        notes: "",
      },
    ],
  });

  const results = optimizePortfolios({
    ...baseInput,
    monthlySpend: { groceries: 500, dining: 500 },
    cards: [chooser],
    maxCards: 1,
  });

  expect(results.length).toBeGreaterThan(0);
  // Should have picked dining (5%) instead of groceries (fallback 1%)
  const groceriesRate = results[0].allocation.find((r) => r.categoryId === "groceries")?.ratePercent;
  const diningRate = results[0].allocation.find((r) => r.categoryId === "dining")?.ratePercent;

  expect(diningRate).toBe(5);
  expect(groceriesRate).toBe(1);
});
