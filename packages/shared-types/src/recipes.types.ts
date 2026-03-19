export interface RecipeIngredient {
  ingredient: string;
  quantity: number;
}

export interface Recipe {
  id: number;
  name: string;
  ingredients: RecipeIngredient[];
}
