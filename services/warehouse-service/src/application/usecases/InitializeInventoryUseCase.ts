import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { INITIAL_INGREDIENTS, INITIAL_QUANTITY } from '../../domain/entities/Inventory';

export class InitializeInventoryUseCase {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(): Promise<void> {
    await Promise.all(
      INITIAL_INGREDIENTS.map((ingredient) =>
        this.inventoryRepo.upsert(ingredient, INITIAL_QUANTITY),
      ),
    );
    console.log('[warehouse] Inventory initialized with', INITIAL_QUANTITY, 'units per ingredient');
  }
}
