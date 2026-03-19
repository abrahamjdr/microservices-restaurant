export interface RecipeRecommendation {
  recipeId: number;
  recipeName: string;
  score: number;
  reasoning: string;
}

export interface AIRecommendRequest {
  availableIngredients: Record<string, number>;
  orderHistory?: string[];
}

export interface AIRecommendResponse {
  recommendations: RecipeRecommendation[];
  generatedAt: string;
}
