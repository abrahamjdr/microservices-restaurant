import { CreateOrderUseCase } from '../application/usecases/CreateOrderUseCase';
import { IOrderRepository } from '../domain/repositories/IOrderRepository';
import { RecipeSelector } from '../domain/services/RecipeSelector';
import { IQueueProducerPort } from '../application/ports/IQueueProducerPort';
import { SseManager } from '../interfaces/http/SseManager';
import { Order, Plate } from '../domain/entities/Order';

/**
 * Drains the microtask/macrotask queue so that fire-and-forget background
 * processing (processOrderAsync) completes before we make assertions.
 */
const flushAsync = () =>
  new Promise<void>((resolve) => setImmediate(resolve)).then(
    () => new Promise<void>((resolve) => setImmediate(resolve)),
  );

const mockOrder: Order = {
  id: 'order-1',
  status: 'PENDING',
  totalPlates: 2,
  createdAt: new Date(),
  completedAt: null,
  plates: [],
};

const mockPlate = (id: string): Plate => ({
  id,
  orderId: 'order-1',
  recipeId: 1,
  recipeName: 'Tomato Rice',
  status: 'PENDING',
  createdAt: new Date(),
  completedAt: null,
});

function makeOrderRepo(overrides: Partial<IOrderRepository> = {}): IOrderRepository {
  return {
    create: jest.fn().mockResolvedValue(mockOrder),
    findById: jest.fn().mockResolvedValue({
      ...mockOrder,
      plates: [
        { ...mockPlate('p1'), status: 'COMPLETED', completedAt: new Date() },
        { ...mockPlate('p2'), status: 'COMPLETED', completedAt: new Date() },
      ],
    }),
    findAll: jest.fn().mockResolvedValue([]),
    updateStatus: jest.fn().mockResolvedValue(mockOrder),
    createPlate: jest
      .fn()
      .mockResolvedValueOnce(mockPlate('p1'))
      .mockResolvedValueOnce(mockPlate('p2')),
    updatePlateStatus: jest.fn().mockImplementation((_id: string, status: string) =>
      Promise.resolve({ ...mockPlate(_id), status }),
    ),
    ...overrides,
  };
}

function makeQueueProducer(): IQueueProducerPort {
  return {
    publishPlateReservation: jest.fn().mockResolvedValue(undefined),
  };
}

describe('CreateOrderUseCase', () => {
  let sseManager: SseManager;

  beforeEach(() => {
    sseManager = new SseManager();
    jest.spyOn(sseManager, 'broadcast').mockImplementation(() => {});
  });

  it('throws on invalid quantity', async () => {
    const useCase = new CreateOrderUseCase(
      makeOrderRepo(),
      new RecipeSelector(),
      makeQueueProducer(),
      sseManager,
    );
    await expect(useCase.execute(0)).rejects.toThrow('Quantity must be between 1 and 50');
    await expect(useCase.execute(51)).rejects.toThrow('Quantity must be between 1 and 50');
  });

  it('returns PENDING order immediately (async / 202 behavior)', async () => {
    const useCase = new CreateOrderUseCase(
      makeOrderRepo(),
      new RecipeSelector(),
      makeQueueProducer(),
      sseManager,
    );

    const result = await useCase.execute(1);

    // Must return PENDING — background processing has not run yet
    expect(result.status).toBe('PENDING');
    expect(result.plates).toHaveLength(1);
    expect(result.plates[0].status).toBe('PENDING');
  });

  it('creates order with correct plate count', async () => {
    const orderRepo = makeOrderRepo();
    const useCase = new CreateOrderUseCase(
      orderRepo,
      new RecipeSelector(),
      makeQueueProducer(),
      sseManager,
    );

    await useCase.execute(2);

    expect(orderRepo.create).toHaveBeenCalledWith(2);
    expect(orderRepo.createPlate).toHaveBeenCalledTimes(2);
  });

  it('publishes one reservation job per plate (after background flush)', async () => {
    const orderRepo = makeOrderRepo({
      createPlate: jest
        .fn()
        .mockResolvedValueOnce(mockPlate('p1'))
        .mockResolvedValueOnce(mockPlate('p2')),
    });
    const queueProducer = makeQueueProducer();
    const useCase = new CreateOrderUseCase(
      orderRepo,
      new RecipeSelector(),
      queueProducer,
      sseManager,
    );

    await useCase.execute(2);
    await flushAsync();

    expect(queueProducer.publishPlateReservation).toHaveBeenCalledTimes(2);
    expect(queueProducer.publishPlateReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        plateId: 'p1',
        orderId: 'order-1',
        recipeId: expect.any(Number),
        recipeName: expect.any(String),
        ingredients: expect.any(Array),
      }),
    );
  });

  it('broadcasts SSE events for order and plate updates (after background flush)', async () => {
    const orderRepo = makeOrderRepo({
      createPlate: jest.fn().mockResolvedValue(mockPlate('p1')),
    });
    const useCase = new CreateOrderUseCase(
      orderRepo,
      new RecipeSelector(),
      makeQueueProducer(),
      sseManager,
    );

    await useCase.execute(1);
    await flushAsync();

    expect(sseManager.broadcast).toHaveBeenCalledWith('order_updated', expect.anything());
    expect(sseManager.broadcast).toHaveBeenCalledWith('plate_updated', expect.anything());
  });
});
