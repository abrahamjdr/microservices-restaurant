export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type PlateStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface Plate {
  id: string;
  orderId: string;
  recipeId: number;
  recipeName: string;
  status: PlateStatus;
  createdAt: Date;
  completedAt: Date | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalPlates: number;
  createdAt: Date;
  completedAt: Date | null;
  plates: Plate[];
}
