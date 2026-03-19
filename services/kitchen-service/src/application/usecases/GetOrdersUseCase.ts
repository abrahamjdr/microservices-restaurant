import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order } from '../../domain/entities/Order';

export class GetOrdersUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async getAll(): Promise<Order[]> {
    return this.orderRepo.findAll();
  }

  async getById(id: string): Promise<Order | null> {
    return this.orderRepo.findById(id);
  }
}
