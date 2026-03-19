export interface RecipeRecommendation {
  recipeId: number;
  recipeName: string;
  score: number;
  reasoning: string;
}

export interface RecommendationResult {
  recommendations: RecipeRecommendation[];
  generatedAt: string;
}
