import type { Card, SpendLimit } from "../types/card";
import { getDescendants } from "./categories";

export function toMonthlyLimit(limit: SpendLimit): number | null {
  if (!limit.amount || !limit.period) return null;
  if (limit.period === "month") return limit.amount;
  if (limit.period === "quarter") return limit.amount / 3;
  return limit.amount / 12;
}

export function formatOriginalLimit(limit: SpendLimit): string {
  if (!limit.amount || !limit.period) return "Unlimited";
  return `$${limit.amount.toLocaleString()}/${limit.period}`;
}

export function formatCalcLimit(limit: SpendLimit): string {
  const monthly = toMonthlyLimit(limit);
  if (!monthly) return "No limit";
  return `$${monthly.toFixed(2)}/month`;
}

export function getPointMultiplier(card: Card): number {
  const cents = card.pointsSystem.userPointValueCents ?? card.pointsSystem.defaultPointValueCents;
  return Math.max(0.01, cents);
}

export function categoryMatchScore(card: Card, categoryId: string): number {
  const descendants = getDescendants(categoryId);
  const matches = card.categoryBonuses
    .filter((bonus) => descendants.includes(bonus.categoryId) || bonus.categoryId === categoryId)
    .map((bonus) => bonus.cashbackPercent);

  return matches.length > 0 ? Math.max(...matches) : card.baseCashbackPercent;
}

export function sumPerkValue(card: Card): number {
  return card.perks.reduce((sum, perk) => sum + (perk.userAnnualValue ?? perk.estimatedAnnualValue), 0);
}

export function signOnBonusDollarValue(card: Card): number {
  if (!card.signOnBonus) return 0;
  if (card.signOnBonus.bonusType === "cash") return card.signOnBonus.bonusAmount;
  return (card.signOnBonus.bonusAmount * getPointMultiplier(card)) / 100;
}
