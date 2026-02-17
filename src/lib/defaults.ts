import { defaultSpendProfile } from "../data/defaultSpend";

export const STORAGE_KEYS = {
  cards: "cc-optimizer-cards-v1",
  spend: "cc-optimizer-spend-v1",
  portfolio: "cc-optimizer-portfolio-v1",
  settings: "cc-optimizer-settings-v1",
} as const;

export const DEFAULT_SETTINGS = {
  annualizeRotatingCategories: true,
  rotatingMode: "annualized" as "annualized" | "current_quarter",
  currentQuarter: "Q1" as "Q1" | "Q2" | "Q3" | "Q4",
  includeSignOnBonusInFirstYear: false,
  maxCardsInWallet: 5,
  excludeDebitCards: false,
  preferredNetwork: null as string | null,
  showAdvancedOptions: false,
  forcedIncludeCardIds: [] as string[],
  forcedExcludeCardIds: [] as string[],
  cardInclusionModeById: {} as Record<string, "include" | "neutral" | "exclude">,
  choosableCategoryOverrides: {} as Record<string, string[]>,
  optimizeAdvancedOpen: false,
  skipDeletePortfolioConfirmation: false,
};

export { defaultSpendProfile };
