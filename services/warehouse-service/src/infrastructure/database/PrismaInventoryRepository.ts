import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import { InventoryItem } from '../../domain/entities/Inventory';
import prisma from './PrismaClient';

export class PrismaInventoryRepository implements IInventoryRepository {
  async findAll(): Promise<InventoryItem[]> {
    return prisma.inventory.findMany({ orderBy: { ingredient: 'asc' } });
  }

  async findByIngredient(ingredient: string): Promise<InventoryItem | null> {
    return prisma.inventory.findUnique({ where: { ingredient } });
  }

  async upsert(ingredient: string, quantity: number): Promise<InventoryItem> {
    return prisma.inventory.upsert({
      where: { ingredient },
      update: {},
      create: { ingredient, quantity },
    });
  }

  /**
   * Reserves `needed` units of `ingredient` using a PostgreSQL row-level FOR UPDATE lock.
   * If stock is insufficient, calls `buyFn` to purchase more stock before retrying.
   * All operations run within a single transaction to prevent race conditions.
   */
  async reserveWithLock(
    ingredient: string,
    needed: number,
    buyFn: (ingredient: string, needed: number) => Promise<number>,
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return prisma.$transaction(async (tx: any) => {
      // Acquire row-level lock
      const rows = await tx.$queryRaw<InventoryItem[]>`
        SELECT id, ingredient, quantity, "updatedAt"
        FROM "warehouse"."Inventory"
        WHERE ingredient = ${ingredient}
        FOR UPDATE
      `;

      if (rows.length === 0) return false;

      let currentQty = rows[0].quantity;

      // If not enough stock, buy from market
      if (currentQty < needed) {
        const bought = await buyFn(ingredient, needed - currentQty);
        if (bought <= 0) {
          return false;
        }

        // Log the purchase
        await tx.$executeRaw`
          INSERT INTO "warehouse"."PurchaseLog" (id, ingredient, "quantityBought", "purchasedAt")
          VALUES (gen_random_uuid(), ${ingredient}, ${bought}, NOW())
        `;

        currentQty += bought;

        // Update inventory with purchased stock first
        await tx.$executeRaw`
          UPDATE "warehouse"."Inventory"
          SET quantity = ${currentQty}, "updatedAt" = NOW()
          WHERE ingredient = ${ingredient}
        `;
      }

      if (currentQty < needed) return false;

      // Deduct reserved amount
      await tx.$executeRaw`
        UPDATE "warehouse"."Inventory"
        SET quantity = quantity - ${needed}, "updatedAt" = NOW()
        WHERE ingredient = ${ingredient}
      `;

      return true;
    });
  }
}
