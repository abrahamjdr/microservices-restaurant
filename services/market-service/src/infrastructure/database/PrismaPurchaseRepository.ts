import { IPurchaseRepository } from '../../domain/repositories/IPurchaseRepository';
import { Purchase } from '../../domain/entities/Purchase';
import prisma from './PrismaClient';

export class PrismaPurchaseRepository implements IPurchaseRepository {
  async create(ingredient: string, quantityReceived: number, success: boolean): Promise<Purchase> {
    return prisma.purchase.create({
      data: { ingredient, quantityReceived, success },
    });
  }

  async findAll(): Promise<Purchase[]> {
    return prisma.purchase.findMany({ orderBy: { requestedAt: 'desc' } });
  }
}
