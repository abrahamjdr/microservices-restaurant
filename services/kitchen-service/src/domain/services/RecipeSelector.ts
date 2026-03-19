import { Recipe } from '@restaurant/shared-types';
import { RECIPES } from '../entities/Recipe';

export class RecipeSelector {
  selectRandom(): Recipe {
    const index = Math.floor(Math.random() * RECIPES.length);
    return RECIPES[index];
  }

  findById(id: number): Recipe | undefined {
    return RECIPES.find((r) => r.id === id);
  }

  getAll(): Recipe[] {
    return [...RECIPES];
  }
}
