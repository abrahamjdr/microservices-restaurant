import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { IMarketPort } from '../ports/IMarketPort';
import { MAX_STOCK } from '../../domain/entities/Inventory';

export class RefillIngredientUseCase {
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly marketPort: IMarketPort,
  ) {}

  async execute(ingredient: string, desiredQty = 1): Promise<{ bought: number; message: string }> {
    let totalBought = 0;

    for (let i = 0; i < desiredQty; i++) {
      const current = await this.inventoryRepo.findByIngredient(ingredient);
      const currentQty = (current?.quantity ?? 0) + totalBought;

      if (currentQty >= MAX_STOCK) break;

      const bought = await this.marketPort.buyIngredient(ingredient, 1);
      if (bought > 0) {
        const toAdd = Math.min(bought, MAX_STOCK - currentQty);
        await this.inventoryRepo.addStock(ingredient, toAdd);
        totalBought += toAdd;
      }
    }

    if (totalBought === 0) {
      return { bought: 0, message: `Market had no ${ingredient} available right now` };
    }
    return {
      bought: totalBought,
      message: `Added ${totalBought} unit(s) of ${ingredient} to inventory`,
    };
  }
}
