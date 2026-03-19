import { InventoryItem } from '../entities/Inventory';

export interface IInventoryRepository {
  findAll(): Promise<InventoryItem[]>;
  findByIngredient(ingredient: string): Promise<InventoryItem | null>;
  upsert(ingredient: string, quantity: number): Promise<InventoryItem>;
  reserveWithLock(
    ingredient: string,
    needed: number,
    buyFn: (ingredient: string, needed: number) => Promise<number>,
  ): Promise<boolean>;
}
