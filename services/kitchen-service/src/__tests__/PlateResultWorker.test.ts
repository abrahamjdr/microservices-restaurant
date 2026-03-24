import { PlateResultWorker } from '../infrastructure/queue/PlateResultWorker';
import { IOrderRepository } from '../domain/repositories/IOrderRepository';
import { SseManager } from '../interfaces/http/SseManager';
import { Order, Plate } from '../domain/entities/Order';

// Mock BullMQ Worker so no real Redis connection is made
jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation((_queue: string, processor: unknown) => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    _processor: processor,
  })),
}));

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    quit: jest.fn().mockResolvedValue(undefined),
  })),
);

const mockOrder: Order = {
  id: 'order-1',
  status: 'IN_PROGRESS',
  totalPlates: 2,
  createdAt: new Date(),
  completedAt: null,
  plates: [],
};

const mockPlate = (id: string, status = 'IN_PROGRESS'): Plate => ({
  id,
  orderId: 'order-1',
  recipeId: 1,
  recipeName: 'Tomato Rice',
  status: status as Plate['status'],
  createdAt: new Date(),
  completedAt: null,
});

function makeOrderRepo(overrides: Partial<IOrderRepository> = {}): IOrderRepository {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue({ ...mockOrder, status: 'COMPLETED' }),
    createPlate: jest.fn(),
    updatePlateStatus: jest.fn().mockImplementation((_id: string, status: string) =>
      Promise.resolve({ ...mockPlate(_id), status }),
    ),
    ...overrides,
  };
}

describe('PlateResultWorker', () => {
  let sseManager: SseManager;

  beforeEach(() => {
    sseManager = new SseManager();
    jest.spyOn(sseManager, 'broadcast').mockImplementation(() => {});
  });

  async function invokeProcess(
    worker: PlateResultWorker,
    data: { plateId: string; orderId: string; success: boolean; message?: string },
  ) {
    // Access the private process method directly for unit testing
    return (worker as unknown as { process: (job: { data: typeof data }) => Promise<void> }).process(
      { data },
    );
  }

  it('marks plate as COMPLETED and broadcasts plate_updated on success', async () => {
    const orderRepo = makeOrderRepo({
      findById: jest.fn().mockResolvedValue({
        ...mockOrder,
        plates: [
          { ...mockPlate('p1'), status: 'COMPLETED' },
          { ...mockPlate('p2'), status: 'IN_PROGRESS' },
        ],
      }),
    });
    const worker = new PlateResultWorker('redis://localhost:6379', orderRepo, sseManager);

    await invokeProcess(worker, { plateId: 'p1', orderId: 'order-1', success: true });

    expect(orderRepo.updatePlateStatus).toHaveBeenCalledWith('p1', 'COMPLETED', expect.any(Date));
    expect(sseManager.broadcast).toHaveBeenCalledWith('plate_updated', expect.anything());
  });

  it('marks plate as FAILED and broadcasts plate_updated on failure', async () => {
    const orderRepo = makeOrderRepo({
      findById: jest.fn().mockResolvedValue({
        ...mockOrder,
        plates: [
          { ...mockPlate('p1'), status: 'FAILED' },
          { ...mockPlate('p2'), status: 'IN_PROGRESS' },
        ],
      }),
    });
    const worker = new PlateResultWorker('redis://localhost:6379', orderRepo, sseManager);

    await invokeProcess(worker, {
      plateId: 'p1',
      orderId: 'order-1',
      success: false,
      message: 'Out of stock',
    });

    expect(orderRepo.updatePlateStatus).toHaveBeenCalledWith('p1', 'FAILED', expect.any(Date));
    expect(sseManager.broadcast).toHaveBeenCalledWith('plate_updated', expect.anything());
  });

  it('updates order to COMPLETED and broadcasts order_updated when all plates are terminal', async () => {
    const orderRepo = makeOrderRepo({
      findById: jest.fn().mockResolvedValue({
        ...mockOrder,
        plates: [
          { ...mockPlate('p1'), status: 'COMPLETED' },
          { ...mockPlate('p2'), status: 'COMPLETED' },
        ],
      }),
    });
    const worker = new PlateResultWorker('redis://localhost:6379', orderRepo, sseManager);

    await invokeProcess(worker, { plateId: 'p2', orderId: 'order-1', success: true });

    expect(orderRepo.updateStatus).toHaveBeenCalledWith('order-1', 'COMPLETED', expect.any(Date));
    expect(sseManager.broadcast).toHaveBeenCalledWith('order_updated', expect.anything());
  });

  it('updates order to FAILED when all plates failed', async () => {
    const orderRepo = makeOrderRepo({
      findById: jest.fn().mockResolvedValue({
        ...mockOrder,
        plates: [
          { ...mockPlate('p1'), status: 'FAILED' },
          { ...mockPlate('p2'), status: 'FAILED' },
        ],
      }),
    });
    const worker = new PlateResultWorker('redis://localhost:6379', orderRepo, sseManager);

    await invokeProcess(worker, { plateId: 'p2', orderId: 'order-1', success: false });

    expect(orderRepo.updateStatus).toHaveBeenCalledWith('order-1', 'FAILED', expect.any(Date));
  });

  it('does not update order status when not all plates are terminal', async () => {
    const orderRepo = makeOrderRepo({
      findById: jest.fn().mockResolvedValue({
        ...mockOrder,
        plates: [
          { ...mockPlate('p1'), status: 'COMPLETED' },
          { ...mockPlate('p2'), status: 'IN_PROGRESS' },
        ],
      }),
    });
    const worker = new PlateResultWorker('redis://localhost:6379', orderRepo, sseManager);

    await invokeProcess(worker, { plateId: 'p1', orderId: 'order-1', success: true });

    expect(orderRepo.updateStatus).not.toHaveBeenCalled();
  });
});
