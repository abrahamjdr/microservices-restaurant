import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { IMarketPort } from '../ports/IMarketPort';

export interface ReserveIngredient {
  ingredient: string;
  quantity: number;
}

export class ReserveIngredientsUseCase {
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly marketPort: IMarketPort,
  ) {}

  async execute(ingredients: ReserveIngredient[]): Promise<{ success: boolean; message?: string }> {
    try {
      // Reserve each ingredient sequentially to avoid deadlocks
      for (const { ingredient, quantity } of ingredients) {
        const reserved = await this.inventoryRepo.reserveWithLock(
          ingredient,
          quantity,
          this.buyFromMarket.bind(this),
        );
        if (!reserved) {
          return { success: false, message: `Could not reserve ${quantity}x ${ingredient}` };
        }
      }
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, message };
    }
  }

  private async buyFromMarket(ingredient: string, _needed: number): Promise<number> {
    // Always buy 1 unit at a time as per the farmers market API contract
    return this.marketPort.buyIngredient(ingredient, 1);
  }
}
