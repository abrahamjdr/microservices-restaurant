import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { RecipeSelector } from '../../domain/services/RecipeSelector';
import { IWarehousePort } from '../ports/IWarehousePort';
import { SseManager } from '../../interfaces/http/SseManager';
import { Order } from '../../domain/entities/Order';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly recipeSelector: RecipeSelector,
    private readonly warehousePort: IWarehousePort,
    private readonly sseManager: SseManager,
  ) {}

  async execute(quantity: number): Promise<Order> {
    if (quantity < 1 || quantity > 50) {
      throw new Error('Quantity must be between 1 and 50');
    }

    const order = await this.orderRepo.create(quantity);

    // Create all plates upfront
    const plates = await Promise.all(
      Array.from({ length: quantity }).map(() => {
        const recipe = this.recipeSelector.selectRandom();
        return this.orderRepo.createPlate(order.id, recipe.id, recipe.name);
      }),
    );

    const updatedOrder = await this.orderRepo.updateStatus(order.id, 'IN_PROGRESS');
    this.sseManager.broadcast('order_updated', { ...updatedOrder, plates });

    // Process all plates concurrently — Promise.allSettled so one failure doesn't cancel others
    await Promise.allSettled(
      plates.map((plate) => this.processPlate(plate.id, plate.recipeId, plate.recipeName)),
    );

    // Determine final order status
    const finalOrder = await this.orderRepo.findById(order.id);
    if (!finalOrder) throw new Error('Order not found after processing');

    const allCompleted = finalOrder.plates.every((p) => p.status === 'COMPLETED');
    const allFailed = finalOrder.plates.every((p) => p.status === 'FAILED');
    const finalStatus = allCompleted ? 'COMPLETED' : allFailed ? 'FAILED' : 'COMPLETED';

    const completedOrder = await this.orderRepo.updateStatus(
      order.id,
      finalStatus,
      new Date(),
    );
    const completedOrderWithPlates = { ...completedOrder, plates: finalOrder.plates };
    this.sseManager.broadcast('order_updated', completedOrderWithPlates);

    return completedOrderWithPlates;
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

    await this.orderRepo.updatePlateStatus(plateId, 'IN_PROGRESS');

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
