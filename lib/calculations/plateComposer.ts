import { computeNetCarbs } from "./netCarbs";

export interface PlateFood {
  id: string;
  name: string;
  tags: string[];
  calories: number;
  totalCarbsG: number;
  fiberG: number;
  sugarAlcoholsG: number;
}

export interface PlateIngredient {
  food: PlateFood;
  quantity: number;
}

export interface GeneratedPlate {
  name: string;
  cookingMethod: string;
  ingredients: PlateIngredient[];
  totalCalories: number;
  totalNetCarbsG: number;
}

export interface PlateNutritionTotals {
  totalCalories: number;
  totalCarbsG: number;
  totalFiberG: number;
  totalSugarAlcoholsG: number;
  totalNetCarbsG: number;
}

export function computePlateNutrition(ingredients: PlateIngredient[]): PlateNutritionTotals {
  const totals = ingredients.reduce(
    (acc, { food, quantity }) => ({
      totalCalories: acc.totalCalories + food.calories * quantity,
      totalCarbsG: acc.totalCarbsG + food.totalCarbsG * quantity,
      totalFiberG: acc.totalFiberG + food.fiberG * quantity,
      totalSugarAlcoholsG: acc.totalSugarAlcoholsG + food.sugarAlcoholsG * quantity,
    }),
    { totalCalories: 0, totalCarbsG: 0, totalFiberG: 0, totalSugarAlcoholsG: 0 }
  );
  return {
    ...totals,
    totalNetCarbsG: computeNetCarbs(totals.totalCarbsG, totals.totalFiberG, totals.totalSugarAlcoholsG),
  };
}

interface CookingMethod {
  id: string;
  label: string;
  minVeg: number;
  maxVeg: number;
  /** at least one chosen veg must carry this tag (e.g. "stuffable" for stuffed peppers) */
  requiresVegTag?: string;
  requiresBreading?: boolean;
  buildName: (protein: PlateFood, veggies: PlateFood[], breading?: PlateFood) => string;
}

export const COOKING_METHODS: CookingMethod[] = [
  {
    id: "sauteed",
    label: "sautéed",
    minVeg: 1,
    maxVeg: 2,
    buildName: (protein, veggies) => `${protein.name}, sautéed with ${joinNames(veggies)}`,
  },
  {
    id: "roasted",
    label: "roasted",
    minVeg: 1,
    maxVeg: 2,
    buildName: (protein, veggies) => `Roasted ${protein.name} with ${joinNames(veggies)}`,
  },
  {
    id: "salad",
    label: "salad",
    minVeg: 2,
    maxVeg: 3,
    buildName: (protein, veggies) => `${protein.name} salad with ${joinNames(veggies)}`,
  },
  {
    id: "stuffed",
    label: "stuffed",
    minVeg: 1,
    maxVeg: 2,
    requiresVegTag: "stuffable",
    buildName: (protein, veggies) => {
      const [stuffable, ...rest] = veggies;
      const withRest = rest.length > 0 ? ` and ${joinNames(rest)}` : "";
      return `Stuffed ${stuffable.name} with ${protein.name}${withRest}`;
    },
  },
  {
    id: "breaded",
    label: "breaded",
    minVeg: 1,
    maxVeg: 1,
    requiresBreading: true,
    buildName: (protein, veggies, breading) =>
      `Breaded ${protein.name} (breaded with ${breading?.name ?? "breading"}) with ${joinNames(veggies)}`,
  },
];

function joinNames(foods: PlateFood[]): string {
  return foods.map((f) => f.name).join(" and ");
}

function pickRandom<T>(pool: T[], rng: () => number): T {
  return pool[Math.floor(rng() * pool.length)];
}

/** Picks `count` distinct items from pool, biasing toward `mustInclude` first if given. */
function pickMany<T>(pool: T[], count: number, rng: () => number, mustInclude?: T): T[] {
  const rest = pool.filter((item) => item !== mustInclude);
  const shuffled = [...rest].sort(() => rng() - 0.5);
  const picked: T[] = mustInclude ? [mustInclude] : [];
  for (const item of shuffled) {
    if (picked.length >= count) break;
    picked.push(item);
  }
  return picked;
}

export function plateSignature(method: string, protein: PlateFood, veggies: PlateFood[]): string {
  const vegIds = veggies
    .map((v) => v.id)
    .sort()
    .join(",");
  return `${method}:${protein.id}:${vegIds}`;
}

export interface GeneratePlateOptions {
  portionScale?: number;
  excludeSignatures?: Set<string>;
  rng?: () => number;
  maxAttempts?: number;
}

/** Generates a candidate lunch/dinner plate from the household's picked protein and
 * vegetable pools plus active seasonings, using a small cooking-method template
 * library. Returns null if the pools can't support any method (e.g. no proteins). */
export function generatePlate(
  proteinPool: PlateFood[],
  vegPool: PlateFood[],
  seasoningPool: PlateFood[],
  breadingPool: PlateFood[],
  options: GeneratePlateOptions = {}
): GeneratedPlate | null {
  if (proteinPool.length === 0 || vegPool.length === 0) return null;

  const portionScale = options.portionScale ?? 1;
  const excludeSignatures = options.excludeSignatures ?? new Set<string>();
  const rng = options.rng ?? Math.random;
  const maxAttempts = options.maxAttempts ?? 20;

  const eligibleMethods = COOKING_METHODS.filter((method) => {
    if (method.minVeg > vegPool.length) return false;
    if (method.requiresVegTag && !vegPool.some((v) => v.tags.includes(method.requiresVegTag!))) return false;
    if (method.requiresBreading && breadingPool.length === 0) return false;
    return true;
  });
  if (eligibleMethods.length === 0) return null;

  let best: { method: CookingMethod; protein: PlateFood; veggies: PlateFood[]; breading?: PlateFood } | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const method = pickRandom(eligibleMethods, rng);
    const protein = pickRandom(proteinPool, rng);
    const vegCount = Math.min(
      vegPool.length,
      method.minVeg + Math.floor(rng() * (method.maxVeg - method.minVeg + 1))
    );

    let veggies: PlateFood[];
    if (method.requiresVegTag) {
      const tagged = vegPool.filter((v) => v.tags.includes(method.requiresVegTag!));
      const anchor = pickRandom(tagged, rng);
      veggies = pickMany(vegPool, vegCount, rng, anchor);
    } else {
      veggies = pickMany(vegPool, vegCount, rng);
    }

    const breading = method.requiresBreading ? pickRandom(breadingPool, rng) : undefined;
    const candidate = { method, protein, veggies, breading };
    const signature = plateSignature(method.id, protein, veggies);

    if (!excludeSignatures.has(signature)) {
      best = candidate;
      break;
    }
    if (!best) best = candidate; // fallback if every attempt collides
  }

  if (!best) return null;

  const seasonings = pickMany(seasoningPool, Math.min(2, seasoningPool.length), rng);
  const ingredients: PlateIngredient[] = [
    { food: best.protein, quantity: portionScale },
    ...best.veggies.map((food) => ({ food, quantity: 1 })),
    ...(best.breading ? [{ food: best.breading, quantity: 1 }] : []),
    ...seasonings.map((food) => ({ food, quantity: 1 })),
  ];

  const totals = computePlateNutrition(ingredients);

  return {
    name: best.method.buildName(best.protein, best.veggies, best.breading),
    cookingMethod: best.method.id,
    ingredients,
    totalCalories: totals.totalCalories,
    totalNetCarbsG: totals.totalNetCarbsG,
  };
}
