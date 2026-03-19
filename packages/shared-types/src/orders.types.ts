export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type PlateStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface PlateDTO {
  id: string;
  orderId: string;
  recipeId: number;
  recipeName: string;
  status: PlateStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface OrderDTO {
  id: string;
  status: OrderStatus;
  totalPlates: number;
  createdAt: string;
  completedAt: string | null;
  plates: PlateDTO[];
}

export interface CreateOrderRequest {
  quantity: number;
}

export interface CreateOrderResponse {
  order: OrderDTO;
}

export interface SseOrderEvent {
  type: 'order_updated' | 'plate_updated';
  payload: OrderDTO | PlateDTO;
}
