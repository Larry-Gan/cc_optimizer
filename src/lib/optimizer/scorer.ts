import type { Card } from "../../types/card";
import type { OptimizationTarget } from "../../types/portfolio";
import { getTargetValue, scorePortfolio, type ScoreOptions } from "../calculations";

export function scoreCardSet(
  cards: Card[],
  monthlySpend: Record<string, number>,
  target: OptimizationTarget,
  includeSignOnBonusInFirstYear: boolean,
  options: ScoreOptions,
) {
  const scored = scorePortfolio(cards, monthlySpend, includeSignOnBonusInFirstYear, options);
  return {
    ...scored,
    targetValue: getTargetValue(scored.score, target),
  };
}
