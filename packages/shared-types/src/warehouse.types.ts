export interface InventoryItem {
  ingredient: string;
  quantity: number;
  updatedAt: string;
}

export interface ReserveIngredientsRequest {
  recipeId: number;
  recipeName: string;
}

export interface ReserveIngredientsResponse {
  success: boolean;
  message?: string;
}

export interface PurchaseLogDTO {
  id: string;
  ingredient: string;
  quantityBought: number;
  purchasedAt: string;
}
