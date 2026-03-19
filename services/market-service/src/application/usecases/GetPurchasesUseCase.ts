import { IPurchaseRepository } from '../../domain/repositories/IPurchaseRepository';
import { Purchase } from '../../domain/entities/Purchase';

export class GetPurchasesUseCase {
  constructor(private readonly purchaseRepo: IPurchaseRepository) {}

  async execute(): Promise<Purchase[]> {
    return this.purchaseRepo.findAll();
  }
}
