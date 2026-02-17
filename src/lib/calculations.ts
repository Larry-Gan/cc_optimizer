import type { Card, CategoryBonus } from "../types/card";
import type { OptimizationTarget, PortfolioScore } from "../types/portfolio";
import { categoryTree, getAncestorIds, getCategoryNode, getDescendants } from "./categories";
import { getPointMultiplier, signOnBonusDollarValue, sumPerkValue, toMonthlyLimit } from "./cardUtils";

export interface CategoryAllocation {
  categoryId: string;
  spend: number;
  cardId: string;
  cardName: string;
  ratePercent: number;
  cashback: number;
  overflowToCardId?: string;
  overflowCashback?: number;
}

export interface ScoreOptions {
  rotatingMode: "annualized" | "current_quarter";
  currentQuarter: "Q1" | "Q2" | "Q3" | "Q4";
}

const defaultScoreOptions: ScoreOptions = {
  rotatingMode: "annualized",
  currentQuarter: "Q1",
};

function adjustedBonusPercent(
  card: Card,
  bonus: CategoryBonus,
  spendCategoryId: string,
  options: ScoreOptions,
): number {
  let rate = bonus.cashbackPercent;
  const activeCondition = card.conditionalBonuses.find((c) => c.isActive);
  if (activeCondition) {
    rate *= activeCondition.categoryBonusMultiplier;
  }

  if (bonus.isRotating) {
    if (!bonus.rotatingSchedule) {
      rate *= options.rotatingMode === "annualized" ? 0.25 : 1;
    } else {
      const quarters = Object.entries(bonus.rotatingSchedule);
      const matchesQuarter = (categories: string[]) =>
        categories.some((category) => {
          const scheduledDescendants = getDescendants(category);
          return scheduledDescendants.includes(spendCategoryId) || category === spendCategoryId;
        });

      if (options.rotatingMode === "current_quarter") {
        const categories = bonus.rotatingSchedule[options.currentQuarter] ?? [];
        rate *= matchesQuarter(categories) ? 1 : 0;
      } else {
        const matchingQuarterCount = quarters.filter(([, categories]) =>
          matchesQuarter(categories),
        ).length;
        const activeFraction = quarters.length > 0 ? matchingQuarterCount / quarters.length : 0.25;
        rate *= activeFraction;
      }
    }
  }

  return rate * getPointMultiplier(card);
}

function adjustedBasePercent(card: Card): number {
  const activeCondition = card.conditionalBonuses.find((c) => c.isActive);
  const base = card.baseCashbackPercent + (activeCondition?.baseCashbackBoost ?? 0);
  return base * getPointMultiplier(card);
}

function categoryAllowsCardNetwork(categoryId: string, card: Card): boolean {
  const categoryNode = getCategoryNode(categoryId);
  if (!categoryNode?.networkRestrictions || categoryNode.networkRestrictions.length === 0) {
    return true;
  }
  return categoryNode.networkRestrictions.includes(card.network);
}

function getEffectiveSpendEntries(monthlySpend: Record<string, number>): Array<{ categoryId: string; spend: number }> {
  const output: Array<{ categoryId: string; spend: number }> = [];
  const visited = new Set<string>();

  const walk = (node: (typeof categoryTree)[number]): number => {
    visited.add(node.id);
    const explicit = monthlySpend[node.id] ?? 0;
    const childEffective = node.children.reduce((sum, child) => sum + walk(child), 0);
    const ownEffective = explicit > 0 ? Math.max(0, explicit - childEffective) : 0;

    if (ownEffective > 0) {
      output.push({ categoryId: node.id, spend: ownEffective });
    }
    return childEffective + ownEffective;
  };

  categoryTree.forEach((node) => {
    walk(node);
  });

  Object.entries(monthlySpend).forEach(([categoryId, spend]) => {
    if (!visited.has(categoryId) && spend > 0) {
      output.push({ categoryId, spend });
    }
  });

  return output.sort((a, b) => b.spend - a.spend);
}

function getBestBonusForSpendCategory(
  card: Card,
  spendCategoryId: string,
  options: ScoreOptions,
): { matchingBonus: CategoryBonus | undefined; rate: number } {
  const baseRate = adjustedBasePercent(card);
  const ancestorIds = getAncestorIds(spendCategoryId);
  const matchingBonuses = card.categoryBonuses.filter((bonus) => ancestorIds.includes(bonus.categoryId));

  if (matchingBonuses.length === 0) {
    return { matchingBonus: undefined, rate: baseRate };
  }

  const bestBonus = matchingBonuses
    .map((bonus) => ({
      bonus,
      rate: adjustedBonusPercent(card, bonus, spendCategoryId, options),
    }))
    .sort((a, b) => b.rate - a.rate)[0];

  if (bestBonus.rate <= baseRate) {
    return { matchingBonus: undefined, rate: baseRate };
  }

  return { matchingBonus: bestBonus.bonus, rate: bestBonus.rate };
}

export function scorePortfolio(
  cards: Card[],
  monthlySpend: Record<string, number>,
  includeSignOnBonus: boolean,
  options: ScoreOptions = defaultScoreOptions,
): { score: PortfolioScore; allocation: CategoryAllocation[] } {
  if (cards.length === 0) {
    return {
      score: {
        monthlyCashback: 0,
        annualCashback: 0,
        annualFees: 0,
        annualPerks: 0,
        signOnValue: 0,
        netAnnualValue: 0,
        firstYearValue: 0,
      },
      allocation: [],
    };
  }

  const allocation: CategoryAllocation[] = [];
  let monthlyCashback = 0;
  const spendEntries = getEffectiveSpendEntries(monthlySpend);

  for (const { categoryId, spend } of spendEntries) {
    if (spend <= 0) continue;

    const candidateRates = cards
      .filter((card) => categoryAllowsCardNetwork(categoryId, card))
      .map((card) => {
        const { matchingBonus, rate } = getBestBonusForSpendCategory(card, categoryId, options);
        return { card, rate, matchingBonus };
      });

    if (candidateRates.length === 0) {
      allocation.push({
        categoryId,
        spend,
        cardId: "unassigned",
        cardName: "No eligible card (network restriction)",
        ratePercent: 0,
        cashback: 0,
      });
      continue;
    }

    candidateRates.sort((a, b) => b.rate - a.rate);
    const best = candidateRates[0];
    const second = candidateRates[1];

    let cashback = 0;
    let overflowCashback = 0;
    let overflowToCardId: string | undefined;
    if (best.matchingBonus) {
      const monthlyLimit = toMonthlyLimit(best.matchingBonus.spendLimit);
      if (monthlyLimit !== null && spend > monthlyLimit) {
        const limitedCashback = monthlyLimit * (best.rate / 100);
        const remaining = spend - monthlyLimit;
        const fallbackRate = second?.rate ?? adjustedBasePercent(best.card);
        overflowCashback = remaining * (fallbackRate / 100);
        cashback = limitedCashback + overflowCashback;
        overflowToCardId = second?.card.id;
      } else {
        cashback = spend * (best.rate / 100);
      }
    } else {
      cashback = spend * (best.rate / 100);
    }

    monthlyCashback += cashback;
    allocation.push({
      categoryId,
      spend,
      cardId: best.card.id,
      cardName: best.card.name,
      ratePercent: best.rate,
      cashback,
      overflowToCardId,
      overflowCashback,
    });
  }

  const annualCashback = monthlyCashback * 12;
  const annualFees = cards.reduce((sum, card) => sum + card.annualFee, 0);
  const annualPerks = cards.reduce((sum, card) => sum + sumPerkValue(card), 0);
  const signOnValue = includeSignOnBonus
    ? cards.reduce((sum, card) => sum + signOnBonusDollarValue(card), 0)
    : 0;
  const netAnnualValue = annualCashback + annualPerks - annualFees;
  const firstYearValue = netAnnualValue + signOnValue;

  return {
    score: {
      monthlyCashback,
      annualCashback,
      annualFees,
      annualPerks,
      signOnValue,
      netAnnualValue,
      firstYearValue,
    },
    allocation,
  };
}

export function getTargetValue(score: PortfolioScore, target: OptimizationTarget): number {
  if (target === "annual_net_value") return score.netAnnualValue;
  if (target === "first_year_value") return score.firstYearValue;
  return score.monthlyCashback;
}
