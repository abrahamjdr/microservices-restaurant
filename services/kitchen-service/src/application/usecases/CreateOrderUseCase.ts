import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { RecipeSelector } from '../../domain/services/RecipeSelector';
import { IQueueProducerPort } from '../ports/IQueueProducerPort';
import { SseManager } from '../../interfaces/http/SseManager';
import { Order, Plate } from '../../domain/entities/Order';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly recipeSelector: RecipeSelector,
    private readonly queueProducer: IQueueProducerPort,
    private readonly sseManager: SseManager,
  ) {}

  /**
   * Creates the order and all plates synchronously (so we can return IDs immediately),
   * then fires off the ingredient reservation in the background via Redis queue.
   * Returns a 202 Accepted-style response — the order is PENDING, not yet processed.
   * Clients subscribe to SSE (/orders/stream) to receive real-time status updates.
   */
  async execute(quantity: number, recipeId?: number): Promise<Order> {
    if (quantity < 1 || quantity > 50) {
      throw new Error('Quantity must be between 1 and 50');
    }

    const depth = await this.queueProducer.getDepth();
    if (depth > 20) {
      throw new Error('KITCHEN_AT_CAPACITY');
    }

    // 1. Create order + plates synchronously — all start as PENDING
    const order = await this.orderRepo.create(quantity);
    const plates = await Promise.all(
      Array.from({ length: quantity }).map(() => {
        const recipe =
          recipeId != null
            ? (this.recipeSelector.findById(recipeId) ?? this.recipeSelector.selectRandom())
            : this.recipeSelector.selectRandom();
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
   * Publishes reservation jobs to Redis — completion is handled by PlateResultWorker.
   */
  private async processOrderAsync(orderId: string, plates: Plate[]): Promise<void> {
    const inProgress = await this.orderRepo.updateStatus(orderId, 'IN_PROGRESS');
    this.sseManager.broadcast('order_updated', { ...inProgress, plates });

    for (const plate of plates) {
      const recipe = this.recipeSelector.findById(plate.recipeId);
      if (!recipe) {
        const failed = await this.orderRepo.updatePlateStatus(plate.id, 'FAILED', new Date());
        this.sseManager.broadcast('plate_updated', failed);
        continue;
      }
      const inProg = await this.orderRepo.updatePlateStatus(plate.id, 'IN_PROGRESS');
      this.sseManager.broadcast('plate_updated', inProg);
      await this.queueProducer.publishPlateReservation({
        plateId: plate.id,
        orderId,
        recipeId: recipe.id,
        recipeName: recipe.name,
        ingredients: recipe.ingredients,
      });
    }
  }
}
