import type { Card } from "../../types/card";
import type { OptimizationTarget, PortfolioScore } from "../../types/portfolio";
import type { CategoryAllocation } from "../calculations";

export interface OptimizerInput {
  cards: Card[];
  monthlySpend: Record<string, number>;
  maxCards: number;
  /** Map of cardId to inclusion mode. */
  cardInclusionModeById: Record<string, "include" | "neutral" | "exclude">;
  /** When set, optimizer uses these category IDs for choosable slots instead of auto-picking. Key = cardId. */
  choosableCategoryOverrides?: Record<string, string[]>;
  target: OptimizationTarget;
  includeSignOnBonusInFirstYear: boolean;
  rotatingMode: "annualized" | "current_quarter";
  currentQuarter: "Q1" | "Q2" | "Q3" | "Q4";
}

export interface OptimizerResult {
  cardIds: string[];
  cards: Card[];
  score: PortfolioScore;
  allocation: CategoryAllocation[];
  evaluatedCombinations: number;
}

export interface OptimizerProgress {
  evaluated: number;
  totalEstimate: number;
  currentBest: OptimizerResult | null;
}
