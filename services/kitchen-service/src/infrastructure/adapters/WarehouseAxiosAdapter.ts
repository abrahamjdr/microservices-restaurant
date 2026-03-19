import axios, { AxiosInstance } from 'axios';
import { Recipe } from '@restaurant/shared-types';
import { IWarehousePort } from '../../application/ports/IWarehousePort';

export class WarehouseAxiosAdapter implements IWarehousePort {
  private readonly client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL, timeout: 30000 });
  }

  async reserveIngredients(recipe: Recipe): Promise<{ success: boolean; message?: string }> {
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        const response = await this.client.post<{ success: boolean; message?: string }>(
          '/internal/reserve',
          { recipeId: recipe.id, recipeName: recipe.name, ingredients: recipe.ingredients },
        );
        return response.data;
      } catch (err) {
        attempt++;
        if (attempt >= maxAttempts) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          return { success: false, message: `Warehouse unavailable: ${message}` };
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
    return { success: false, message: 'Max retries exceeded' };
  }
}
