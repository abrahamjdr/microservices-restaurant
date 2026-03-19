import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { RecipeSelector } from '../../domain/services/RecipeSelector';
import { IWarehousePort } from '../ports/IWarehousePort';
import { SseManager } from '../../interfaces/http/SseManager';
import { Order, Plate } from '../../domain/entities/Order';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly recipeSelector: RecipeSelector,
    private readonly warehousePort: IWarehousePort,
    private readonly sseManager: SseManager,
  ) {}

  /**
   * Creates the order and all plates synchronously (so we can return IDs immediately),
   * then fires off the ingredient reservation + cooking in the background.
   * Returns a 202 Accepted-style response — the order is PENDING, not yet processed.
   * Clients subscribe to SSE (/orders/stream) to receive real-time status updates.
   */
  async execute(quantity: number): Promise<Order> {
    if (quantity < 1 || quantity > 50) {
      throw new Error('Quantity must be between 1 and 50');
    }

    // 1. Create order + plates synchronously — all start as PENDING
    const order = await this.orderRepo.create(quantity);
    const plates = await Promise.all(
      Array.from({ length: quantity }).map(() => {
        const recipe = this.recipeSelector.selectRandom();
        return this.orderRepo.createPlate(order.id, recipe.id, recipe.name);
      }),
    );

    // 2. Return immediately with PENDING order — client tracks via SSE
    const pendingOrder: Order = { ...order, plates };

    // 3. Process asynchronously in background (fire and forget)
    this.processOrderAsync(order.id, plates).catch((err) => {
      console.error(`[kitchen] Background processing failed for order ${order.id}:`, err);
    });

    return pendingOrder;
  }

  /**
   * Runs entirely in the background after the HTTP response is sent.
   * Broadcasts SSE events at every state transition so the frontend stays in sync.
   */
  private async processOrderAsync(orderId: string, plates: Plate[]): Promise<void> {
    // Transition order → IN_PROGRESS and notify clients
    const inProgressOrder = await this.orderRepo.updateStatus(orderId, 'IN_PROGRESS');
    this.sseManager.broadcast('order_updated', { ...inProgressOrder, plates });

    // Process all plates concurrently — allSettled ensures one failure doesn't cancel others
    await Promise.allSettled(
      plates.map((plate) => this.processPlate(plate.id, plate.recipeId, plate.recipeName)),
    );

    // Determine final order status
    const finalOrder = await this.orderRepo.findById(orderId);
    if (!finalOrder) return;

    const anyCompleted = finalOrder.plates.some((p) => p.status === 'COMPLETED');
    const allFailed = finalOrder.plates.every((p) => p.status === 'FAILED');
    const finalStatus = allFailed ? 'FAILED' : anyCompleted ? 'COMPLETED' : 'FAILED';

    const completedOrder = await this.orderRepo.updateStatus(orderId, finalStatus, new Date());
    this.sseManager.broadcast('order_updated', {
      ...completedOrder,
      plates: finalOrder.plates,
    });
  }

  private async processPlate(
    plateId: string,
    recipeId: number,
    recipeName: string,
  ): Promise<void> {
    const recipe = this.recipeSelector.findById(recipeId);
    if (!recipe) {
      await this.orderRepo.updatePlateStatus(plateId, 'FAILED', new Date());
      return;
    }

    const inProgressPlate = await this.orderRepo.updatePlateStatus(plateId, 'IN_PROGRESS');
    this.sseManager.broadcast('plate_updated', inProgressPlate);

    try {
      const result = await this.warehousePort.reserveIngredients(recipe);
      if (result.success) {
        const completedPlate = await this.orderRepo.updatePlateStatus(
          plateId,
          'COMPLETED',
          new Date(),
        );
        this.sseManager.broadcast('plate_updated', completedPlate);
      } else {
        const failedPlate = await this.orderRepo.updatePlateStatus(
          plateId,
          'FAILED',
          new Date(),
        );
        this.sseManager.broadcast('plate_updated', failedPlate);
      }
    } catch {
      const failedPlate = await this.orderRepo.updatePlateStatus(plateId, 'FAILED', new Date());
      this.sseManager.broadcast('plate_updated', failedPlate);
    }
  }
}
