import { Order, OrderStatus, Plate, PlateStatus } from '../entities/Order';

export interface IOrderRepository {
  create(totalPlates: number): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus, completedAt?: Date): Promise<Order>;
  createPlate(orderId: string, recipeId: number, recipeName: string): Promise<Plate>;
  updatePlateStatus(plateId: string, status: PlateStatus, completedAt?: Date): Promise<Plate>;
}
