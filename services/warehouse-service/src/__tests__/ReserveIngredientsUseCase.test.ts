import { ReserveIngredientsUseCase } from '../application/usecases/ReserveIngredientsUseCase';
import { IInventoryRepository } from '../domain/repositories/IInventoryRepository';
import { IMarketPort } from '../application/ports/IMarketPort';

function makeInventoryRepo(reserveResult = true): IInventoryRepository {
  return {
    findAll: jest.fn(),
    findByIngredient: jest.fn(),
    upsert: jest.fn(),
    addStock: jest.fn(),
    setStock: jest.fn(),
    reserveWithLock: jest.fn().mockResolvedValue(reserveResult),
  };
}

describe('ReserveIngredientsUseCase', () => {
  it('returns success when all ingredients reserved', async () => {
    const repo = makeInventoryRepo(true);
    const market: IMarketPort = { buyIngredient: jest.fn() };
    const useCase = new ReserveIngredientsUseCase(repo, market);

    const result = await useCase.execute([
      { ingredient: 'tomato', quantity: 2 },
      { ingredient: 'rice', quantity: 1 },
    ]);

    expect(result.success).toBe(true);
    expect(repo.reserveWithLock).toHaveBeenCalledTimes(2);
  });

  it('returns failure when an ingredient cannot be reserved', async () => {
    const repo = makeInventoryRepo(false);
    const market: IMarketPort = { buyIngredient: jest.fn() };
    const useCase = new ReserveIngredientsUseCase(repo, market);

    const result = await useCase.execute([{ ingredient: 'meat', quantity: 1 }]);

    expect(result.success).toBe(false);
    expect(result.message).toContain('meat');
  });

  it('stops reserving on first failure', async () => {
    const repo: IInventoryRepository = {
      findAll: jest.fn(),
      findByIngredient: jest.fn(),
      upsert: jest.fn(),
      addStock: jest.fn(),
      setStock: jest.fn(),
      reserveWithLock: jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),
    };
    const market: IMarketPort = { buyIngredient: jest.fn() };
    const useCase = new ReserveIngredientsUseCase(repo, market);

    const result = await useCase.execute([
      { ingredient: 'chicken', quantity: 2 },
      { ingredient: 'potato', quantity: 1 },
    ]);

    expect(result.success).toBe(false);
    // Second ingredient should not be attempted
    expect(repo.reserveWithLock).toHaveBeenCalledTimes(1);
  });
});
