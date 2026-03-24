import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { INITIAL_INGREDIENTS, INITIAL_QUANTITY } from '../../domain/entities/Inventory';
import { ConsumptionTracker } from '../../infrastructure/ai/ConsumptionTracker';
import { AnalysisCache } from '../../infrastructure/ai/AnalysisCache';

export class ResetInventoryUseCase {
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly consumptionTracker: ConsumptionTracker,
    private readonly analysisCache: AnalysisCache,
  ) {}

  async execute(): Promise<void> {
    await Promise.all(
      INITIAL_INGREDIENTS.map((ingredient) =>
        this.inventoryRepo.setStock(ingredient, INITIAL_QUANTITY),
      ),
    );
    this.consumptionTracker.reset();
    this.analysisCache.clear();
    console.log('[warehouse] Inventory reset to', INITIAL_QUANTITY, 'units per ingredient');
  }
}
