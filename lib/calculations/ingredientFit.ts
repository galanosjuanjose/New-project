import { isApplicableToProfile, type ProfileKey } from "./menuRotation";
import type { MealTemplate } from "@/lib/types/domain";

export interface NewIngredient {
  name: string;
  tags: string[];
}

export interface UsageSuggestion {
  template: MealTemplate;
  suggestion: string;
}

/** Maps a new ingredient's category tag to the meal-template tags it could slot into.
 * e.g. a new "keto flour" (tag: flour) could sub into pancakes or a breaded/fried dish. */
export const INGREDIENT_TO_TEMPLATE_TAGS: Record<string, string[]> = {
  flour: ["pancake", "fried"],
  pasta_alt: ["pasta_alt"],
  bread_alt: ["bread_bun", "bread_alt"],
  sweetener: ["dessert", "pancake"],
  cheese: [],
  nut: [],
  savory: [],
};

function buildSuggestion(ingredient: NewIngredient, template: MealTemplate): string {
  return `Try swapping in ${ingredient.name} for the usual pick in "${template.name}" (${template.mealType}).`;
}

/** Cross-references a new/unfamiliar ingredient (e.g. spotted at the supermarket)
 * against the couple's existing meal rotation and suggests concrete slots for it. */
export function suggestUsage(
  ingredient: NewIngredient,
  mealTemplates: MealTemplate[],
  profile?: ProfileKey
): UsageSuggestion[] {
  const relatedTemplateTags = new Set(
    ingredient.tags.flatMap((tag) => INGREDIENT_TO_TEMPLATE_TAGS[tag] ?? [])
  );
  if (relatedTemplateTags.size === 0) return [];

  return mealTemplates
    .filter((t) => !profile || isApplicableToProfile(t, profile))
    .filter((t) => t.tags.some((tag) => relatedTemplateTags.has(tag)))
    .map((template) => ({ template, suggestion: buildSuggestion(ingredient, template) }));
}
