/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql.
 * Regenerate with `supabase gen types typescript` once a live project exists,
 * and keep this file as the fallback / reference for local development.
 */

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type FoodCategory =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "dessert"
  | "beverage"
  | "ingredient";
export type MealTemplateType = "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
export type AppliesTo = "both" | "juan_only" | "mariana_only";
export type LogMealType = "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | "beverage";
export type FoodGroup = "protein" | "vegetable" | "seasoning" | "dairy" | "fat" | "other";
export type CreatedVia = "authored" | "generated";

export type ProfileRow = {
  id: string;
  household_id: string | null;
  display_name: string;
  height_in: number | null;
  weight_lb: number | null;
  activity_level: ActivityLevel;
  tdee_kcal: number | null;
  calorie_target: number | null;
  net_carb_target_low: number | null;
  net_carb_target_high: number | null;
  avatar_color: string | null;
  updated_at: string;
  created_at: string;
};

export type FoodRow = {
  id: string;
  household_id: string | null;
  name: string;
  brand: string | null;
  category: FoodCategory;
  default_serving_label: string | null;
  calories: number;
  total_carbs_g: number;
  fiber_g: number;
  sugar_alcohols_g: number;
  protein_g: number | null;
  fat_g: number | null;
  net_carbs_g: number;
  is_keto_friendly: boolean;
  tags: string[];
  is_new_discovery: boolean;
  food_group: FoodGroup;
  created_by: string | null;
  created_at: string;
};

export type MealTemplateRow = {
  id: string;
  household_id: string | null;
  name: string;
  meal_type: MealTemplateType;
  applies_to: AppliesTo;
  base_calories: number;
  base_net_carbs_g: number;
  portion_note: string | null;
  tags: string[];
  created_via: CreatedVia;
  is_favorite: boolean;
  created_at: string;
};

export type PlateIngredientRow = {
  id: string;
  meal_template_id: string;
  food_id: string;
  quantity: number;
  unit: string;
  created_at: string;
};

export type SeasoningRow = {
  id: string;
  household_id: string;
  food_id: string;
  is_active: boolean;
  created_at: string;
};

export type IngredientPoolSelectionRow = {
  household_id: string;
  protein_food_ids: string[];
  vegetable_food_ids: string[];
  updated_at: string;
};

export type FoodLogRow = {
  id: string;
  profile_id: string;
  food_id: string | null;
  meal_template_id: string | null;
  custom_name: string | null;
  meal_type: LogMealType;
  calories: number;
  net_carbs_g: number;
  total_carbs_g: number | null;
  fiber_g: number | null;
  sugar_alcohols_g: number | null;
  quantity: number;
  logged_at: string;
  created_at: string;
};

export type WeightLogRow = {
  id: string;
  profile_id: string;
  weight_lb: number;
  logged_at: string;
  created_at: string;
};

export type SnackSuggestionRow = {
  id: string;
  household_id: string | null;
  name: string;
  calories: number;
  net_carbs_g: number;
  style_tags: string[];
  created_at: string;
};

export type WeeklyMenuItemRow = {
  id: string;
  household_id: string;
  profile_id: string;
  day_date: string;
  meal_type: MealTemplateType;
  meal_template_id: string;
  created_at: string;
};

interface Table<Row, Insert> {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Partial<ProfileRow> & { id: string }>;
      foods: Table<FoodRow, Partial<FoodRow>>;
      meal_templates: Table<MealTemplateRow, Partial<MealTemplateRow>>;
      food_logs: Table<FoodLogRow, Partial<FoodLogRow>>;
      weight_logs: Table<WeightLogRow, Partial<WeightLogRow>>;
      snack_suggestions: Table<SnackSuggestionRow, Partial<SnackSuggestionRow>>;
      weekly_menu_items: Table<WeeklyMenuItemRow, Partial<WeeklyMenuItemRow>>;
      plate_ingredients: Table<PlateIngredientRow, Partial<PlateIngredientRow>>;
      seasonings: Table<SeasoningRow, Partial<SeasoningRow>>;
      ingredient_pool_selections: Table<IngredientPoolSelectionRow, Partial<IngredientPoolSelectionRow>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
