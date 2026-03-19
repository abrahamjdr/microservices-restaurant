import { IPurchaseRepository } from '../../domain/repositories/IPurchaseRepository';
import axios from 'axios';

interface FarmersMarketResponse {
  quantitySold: number;
}

export class BuyIngredientUseCase {
  private readonly farmersMarketUrl: string;

  constructor(
    private readonly purchaseRepo: IPurchaseRepository,
    farmersMarketUrl: string,
  ) {
    this.farmersMarketUrl = farmersMarketUrl;
  }

  async execute(
    ingredient: string,
    quantity: number,
  ): Promise<{ quantityReceived: number; success: boolean }> {
    let quantityReceived = 0;
    let success = false;

    try {
      const response = await axios.get<FarmersMarketResponse>(this.farmersMarketUrl, {
        params: { ingredient },
        timeout: 10000,
      });

      quantityReceived = response.data.quantitySold ?? 0;
      success = quantityReceived > 0;
    } catch {
      quantityReceived = 0;
      success = false;
    }

    await this.purchaseRepo.create(ingredient, quantityReceived, success);

    return { quantityReceived, success };
  }
}
