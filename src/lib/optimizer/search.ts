import type { Card } from "../../types/card";
import type { OptimizerInput, OptimizerProgress, OptimizerResult } from "./types";
import { pruneDominatedCards } from "./pruner";
import { scoreCardSet } from "./scorer";
import { topLevelCategories } from "../categories";

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  if (arr.length === k) return [arr];

  const [head, ...tail] = arr;
  const withHead = combinations(tail, k - 1).map((combo) => [head, ...combo]);
  const withoutHead = combinations(tail, k);
  return withHead.concat(withoutHead);
}

function estimateCombinationCount(n: number, k: number): number {
  if (k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - i + 1)) / i;
  }
  return Math.floor(result);
}

function estimateCombinationCountUpTo(n: number, maxK: number): number {
  let total = 0;
  for (let k = 0; k <= Math.min(n, maxK); k += 1) {
    total += estimateCombinationCount(n, k);
  }
  return total;
}

function isExclusivityCompatible(cards: Card[]): boolean {
  const selectedIds = new Set(cards.map((card) => card.id));

  for (const card of cards) {
    for (const rule of card.exclusivityRules) {
      if (rule.ruleType === "cannot_hold_with") {
        if (rule.cardIds.some((id) => selectedIds.has(id))) {
          return false;
        }
      }
      if (rule.ruleType === "one_of_family") {
        const family = new Set([card.id, ...rule.cardIds]);
        let count = 0;
        for (const selected of cards) {
          if (family.has(selected.id)) {
            count += 1;
            if (count > 1) return false;
          }
        }
      }
    }
  }

  return true;
}

function getScoringOptions(input: OptimizerInput) {
  return {
    rotatingMode: input.rotatingMode,
    currentQuarter: input.currentQuarter,
  } as const;
}

function getChooserCandidates(monthlySpend: Record<string, number>, allowedCategoryIds?: string[]): string[] {
  const source = allowedCategoryIds && allowedCategoryIds.length > 0 ? allowedCategoryIds : topLevelCategories;
  const spendOrdered = Object.entries(monthlySpend)
    .filter(([categoryId, spend]) => spend > 0 && source.includes(categoryId))
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId]) => categoryId);
  const combined = [...spendOrdered, ...source];
  return Array.from(new Set(combined)).slice(0, 8);
}

function getCardVariants(card: Card, input: OptimizerInput): Card[] {
  const choosableBonuses = card.categoryBonuses.filter((bonus) => bonus.isUserChoosable);
  if (choosableBonuses.length === 0) return [card];

  const bonus = choosableBonuses[0];
  const slots = Math.max(1, bonus.maxChoosableSlots ?? 1);
  const fixedBonuses = card.categoryBonuses.filter((bonus) => !bonus.isUserChoosable);
  const template = bonus;

  const override = input.choosableCategoryOverrides?.[card.id];
  if (override && override.length > 0) {
    const allowed = new Set(bonus.allowedCategoryIds ?? []);
    const chosen = override
      .filter((id) => allowed.size === 0 || allowed.has(id))
      .slice(0, slots)
      .map((categoryId) => ({
        ...template,
        categoryId,
        isUserChoosable: false,
        maxChoosableSlots: null,
      }));
    return [
      {
        ...card,
        categoryBonuses: [...fixedBonuses, ...chosen],
      },
    ];
  }

  const candidates = getChooserCandidates(input.monthlySpend, bonus.allowedCategoryIds);
  const pickCount = Math.min(slots, candidates.length);
  const candidateCombos = combinations(candidates, pickCount).slice(0, 24);

  return candidateCombos.map((combo) => ({
    ...card,
    categoryBonuses: [
      ...fixedBonuses,
      ...combo.map((categoryId) => ({
        ...template,
        categoryId,
        isUserChoosable: false,
        maxChoosableSlots: null,
      })),
    ],
  }));
}

function scoreSetWithChoosableVariants(
  cards: Card[],
  input: OptimizerInput,
): (ReturnType<typeof scoreCardSet> & { cards: Card[] }) | null {
  if (!isExclusivityCompatible(cards)) return null;

  const variantLists = cards.map((card) => getCardVariants(card, input));
  const scoringOptions = getScoringOptions(input);
  let best: (ReturnType<typeof scoreCardSet> & { cards: Card[] }) | null = null;

  const walk = (idx: number, picked: Card[]) => {
    if (idx === variantLists.length) {
      const scored = scoreCardSet(
        picked,
        input.monthlySpend,
        input.target,
        input.includeSignOnBonusInFirstYear,
        scoringOptions,
      );
      if (!best || scored.targetValue > best.targetValue) {
        best = { ...scored, cards: [...picked] };
      }
      return;
    }

    for (const variant of variantLists[idx]) {
      picked.push(variant);
      walk(idx + 1, picked);
      picked.pop();
    }
  };

  walk(0, []);
  return best;
}

function heuristicSearch(input: OptimizerInput): OptimizerResult[] {
  const inclusion = input.cardInclusionModeById;
  const eligible = input.cards.filter((card) => {
    const mode = inclusion[card.id] ?? "neutral";
    if (mode === "exclude") return false;
    if (mode === "include") return true;
    return card.isActive;
  });

  const forced = eligible.filter((card) => inclusion[card.id] === "include");
  const pool = eligible.filter((card) => inclusion[card.id] !== "include");
  const targetSlots = Math.max(input.maxCards - forced.length, 0);

  let selected = [...forced];
  const candidates = [...pool];
  while (selected.length < input.maxCards && candidates.length > 0) {
    let bestCard: Card | null = null;
    let bestValue = -Infinity;
    for (const candidate of candidates) {
      const trial = [...selected, candidate];
      const scored = scoreSetWithChoosableVariants(trial, input);
      if (scored && scored.targetValue > bestValue) {
        bestValue = scored.targetValue;
        bestCard = candidate;
      }
    }
    if (!bestCard) break;
    selected.push(bestCard);
    const index = candidates.findIndex((c) => c.id === bestCard?.id);
    if (index >= 0) candidates.splice(index, 1);
  }

  const finalSet = selected.slice(0, forced.length + targetSlots);
  const scored = scoreSetWithChoosableVariants(finalSet, input);
  if (!scored) return [];

  return [
    {
      cardIds: finalSet.map((card) => card.id),
      cards: scored.cards,
      score: scored.score,
      allocation: scored.allocation,
      evaluatedCombinations: eligible.length,
    },
  ];
}

export function optimizePortfolios(
  input: OptimizerInput,
  onProgress?: (progress: OptimizerProgress) => void,
): OptimizerResult[] {
  const inclusion = input.cardInclusionModeById;
  const eligible = pruneDominatedCards(
    input.cards.filter((card) => {
      const mode = inclusion[card.id] ?? "neutral";
      if (mode === "exclude") return false;
      if (mode === "include") return true;
      return card.isActive;
    }),
  );

  const forced = eligible.filter((card) => inclusion[card.id] === "include");
  const pool = eligible.filter((card) => inclusion[card.id] !== "include");
  const remainingSlots = Math.max(input.maxCards - forced.length, 0);

  if (!isExclusivityCompatible(forced)) {
    return [];
  }

  if (pool.length > 24) {
    return heuristicSearch(input);
  }

  const cardCombos: Card[][] = [];
  for (let k = 0; k <= Math.min(pool.length, remainingSlots); k += 1) {
    cardCombos.push(...combinations(pool, k).map((combo) => [...forced, ...combo]));
  }
  const totalEstimate = estimateCombinationCountUpTo(pool.length, remainingSlots);
  let currentBest: OptimizerResult | null = null;
  let currentBestValue = -Infinity;

  const ranked = cardCombos
    .map((cards, idx) => {
      const scored = scoreSetWithChoosableVariants(cards, input);
      if (!scored) return null;
      const result: OptimizerResult = {
        cardIds: cards.map((card) => card.id),
        cards: scored.cards,
        score: scored.score,
        allocation: scored.allocation,
        evaluatedCombinations: idx + 1,
      };

      if (!currentBest || scored.targetValue > currentBestValue) {
        currentBest = result;
        currentBestValue = scored.targetValue;
      }

      if (onProgress && (idx % 50 === 0 || idx === cardCombos.length - 1)) {
        onProgress({ evaluated: idx + 1, totalEstimate, currentBest });
      }
      return { result, value: scored.targetValue };
    })
    .filter((item): item is { result: OptimizerResult; value: number } => Boolean(item))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20)
    .map((item) => item.result);

  return ranked;
}
