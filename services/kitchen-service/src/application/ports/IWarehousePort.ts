import { Recipe } from '@restaurant/shared-types';

export interface IWarehousePort {
  reserveIngredients(recipe: Recipe): Promise<{ success: boolean; message?: string }>;
}
