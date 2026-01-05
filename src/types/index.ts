export interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
}

export interface PlannedMeal {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  day: string;
  time: string;
}

export interface Recipe {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  recipe?: string;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface AnalyzedNutrition {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}
