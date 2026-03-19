import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { InventoryItem } from '../../domain/entities/Inventory';

export class GetInventoryUseCase {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(): Promise<InventoryItem[]> {
    return this.inventoryRepo.findAll();
  }
}
