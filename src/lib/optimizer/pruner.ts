import type { Card } from "../../types/card";
import { topLevelCategories } from "../categories";
import { categoryMatchScore, sumPerkValue } from "../cardUtils";

function dominates(a: Card, b: Card): boolean {
  if (a.annualFee > b.annualFee) return false;
  if (sumPerkValue(a) < sumPerkValue(b)) return false;

  const allCategoriesAtLeastAsGood = topLevelCategories.every(
    (category) => categoryMatchScore(a, category) >= categoryMatchScore(b, category),
  );
  const someCategoryStrictlyBetter = topLevelCategories.some(
    (category) => categoryMatchScore(a, category) > categoryMatchScore(b, category),
  );

  return allCategoriesAtLeastAsGood && someCategoryStrictlyBetter;
}

export function pruneDominatedCards(cards: Card[]): Card[] {
  return cards.filter((candidate, idx) => {
    for (let i = 0; i < cards.length; i += 1) {
      if (i === idx) continue;
      if (dominates(cards[i], candidate)) {
        return false;
      }
    }
    return true;
  });
}
