import { BuyIngredientUseCase } from '../application/usecases/BuyIngredientUseCase';
import { IPurchaseRepository } from '../domain/repositories/IPurchaseRepository';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makePurchaseRepo(): IPurchaseRepository {
  return {
    create: jest.fn().mockResolvedValue({ id: '1', ingredient: 'tomato', quantityReceived: 3, requestedAt: new Date(), success: true }),
    findAll: jest.fn().mockResolvedValue([]),
  };
}

describe('BuyIngredientUseCase', () => {
  it('returns quantity from farmers market and logs purchase', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: { quantitySold: 3 } });
    const repo = makePurchaseRepo();
    const useCase = new BuyIngredientUseCase(repo, 'http://market.test/buy');

    const result = await useCase.execute('tomato', 1);

    expect(result.quantityReceived).toBe(3);
    expect(result.success).toBe(true);
    expect(repo.create).toHaveBeenCalledWith('tomato', 3, true);
  });

  it('logs failed purchase on market error', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue(new Error('Network error'));
    const repo = makePurchaseRepo();
    const useCase = new BuyIngredientUseCase(repo, 'http://market.test/buy');

    const result = await useCase.execute('chicken', 1);

    expect(result.quantityReceived).toBe(0);
    expect(result.success).toBe(false);
    expect(repo.create).toHaveBeenCalledWith('chicken', 0, false);
  });

  it('treats quantitySold=0 as failure', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: { quantitySold: 0 } });
    const repo = makePurchaseRepo();
    const useCase = new BuyIngredientUseCase(repo, 'http://market.test/buy');

    const result = await useCase.execute('meat', 1);

    expect(result.success).toBe(false);
  });
});
