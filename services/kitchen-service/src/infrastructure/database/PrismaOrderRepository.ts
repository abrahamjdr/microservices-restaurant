import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order, OrderStatus, Plate, PlateStatus } from '../../domain/entities/Order';
import prisma from './PrismaClient';

export class PrismaOrderRepository implements IOrderRepository {
  async create(totalPlates: number): Promise<Order> {
    const order = await prisma.order.create({
      data: { totalPlates, status: 'PENDING' },
      include: { plates: true },
    });
    return this.mapOrder(order);
  }

  async findById(id: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { plates: true },
    });
    return order ? this.mapOrder(order) : null;
  }

  async findAll(): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      include: { plates: true },
      orderBy: { createdAt: 'desc' },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (orders as any[]).map((o) => this.mapOrder(o));
  }

  async updateStatus(id: string, status: OrderStatus, completedAt?: Date): Promise<Order> {
    const order = await prisma.order.update({
      where: { id },
      data: { status, completedAt: completedAt ?? null },
      include: { plates: true },
    });
    return this.mapOrder(order);
  }

  async createPlate(orderId: string, recipeId: number, recipeName: string): Promise<Plate> {
    const plate = await prisma.plate.create({
      data: { orderId, recipeId, recipeName, status: 'PENDING' },
    });
    return this.mapPlate(plate);
  }

  async updatePlateStatus(
    plateId: string,
    status: PlateStatus,
    completedAt?: Date,
  ): Promise<Plate> {
    const plate = await prisma.plate.update({
      where: { id: plateId },
      data: { status, completedAt: completedAt ?? null },
    });
    return this.mapPlate(plate);
  }

  private mapOrder(order: {
    id: string;
    status: string;
    totalPlates: number;
    createdAt: Date;
    completedAt: Date | null;
    plates: Array<{
      id: string;
      orderId: string;
      recipeId: number;
      recipeName: string;
      status: string;
      createdAt: Date;
      completedAt: Date | null;
    }>;
  }): Order {
    return {
      id: order.id,
      status: order.status as OrderStatus,
      totalPlates: order.totalPlates,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      plates: order.plates.map((p) => this.mapPlate(p)),
    };
  }

  private mapPlate(plate: {
    id: string;
    orderId: string;
    recipeId: number;
    recipeName: string;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
  }): Plate {
    return {
      id: plate.id,
      orderId: plate.orderId,
      recipeId: plate.recipeId,
      recipeName: plate.recipeName,
      status: plate.status as PlateStatus,
      createdAt: plate.createdAt,
      completedAt: plate.completedAt,
    };
  }
}
