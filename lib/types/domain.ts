export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | "beverage";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export type AppliesTo = "both" | "juan_only" | "mariana_only";

export interface ProfileTargets {
  calorieTarget: number;
  netCarbTargetLow: number;
  netCarbTargetHigh: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  mealType: Exclude<MealType, "beverage">;
  appliesTo: AppliesTo;
  baseCalories: number;
  baseNetCarbsG: number;
  tags: string[];
}

export interface ProfileQuirks {
  /** "keto_bread_always" (Mariana) or "lettuce_wrap_except_ham_cheese" (Juan) */
  breadPreference: "keto_bread_always" | "lettuce_wrap_except_ham_cheese";
  portionScale: number;
}

export interface FoodLogEntry {
  id: string;
  profileId: string;
  foodId: string | null;
  customName: string | null;
  mealType: MealType;
  calories: number;
  netCarbsG: number;
  loggedAt: string;
}

export interface SnackSuggestion {
  id: string;
  name: string;
  calories: number;
  netCarbsG: number;
  styleTags: string[];
}

export interface WeightEntry {
  date: string;
  weightLb: number;
}
