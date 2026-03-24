import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { IMarketPort } from '../ports/IMarketPort';
import { MAX_STOCK } from '../../domain/entities/Inventory';

export class RefillIngredientUseCase {
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly marketPort: IMarketPort,
  ) {}

  async execute(ingredient: string): Promise<{ bought: number; message: string }> {
    const current = await this.inventoryRepo.findByIngredient(ingredient);
    const currentQty = current?.quantity ?? 0;

    if (currentQty >= MAX_STOCK) {
      return { bought: 0, message: `${ingredient} already at max stock (${MAX_STOCK})` };
    }

    const bought = await this.marketPort.buyIngredient(ingredient, 1);
    if (bought > 0) {
      // Cap so the total never exceeds MAX_STOCK
      const toAdd = Math.min(bought, MAX_STOCK - currentQty);
      await this.inventoryRepo.addStock(ingredient, toAdd);
      return { bought: toAdd, message: `Added ${toAdd} unit(s) of ${ingredient} to inventory` };
    }

    return { bought: 0, message: `Market had no ${ingredient} available right now` };
  }
}
