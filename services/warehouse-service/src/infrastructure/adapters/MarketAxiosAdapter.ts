import axios, { AxiosInstance } from 'axios';
import { IMarketPort } from '../../application/ports/IMarketPort';

export class MarketAxiosAdapter implements IMarketPort {
  private readonly client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL, timeout: 15000 });
  }

  async buyIngredient(ingredient: string, quantity: number): Promise<number> {
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        const response = await this.client.post<{ quantityReceived: number; success: boolean }>(
          '/buy',
          { ingredient, quantity },
        );
        return response.data.success ? response.data.quantityReceived : 0;
      } catch (err) {
        attempt++;
        if (attempt >= maxAttempts) return 0;
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
    return 0;
  }
}
