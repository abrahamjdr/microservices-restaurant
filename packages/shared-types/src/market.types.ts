export interface BuyIngredientRequest {
  ingredient: string;
  quantity: number;
}

export interface BuyIngredientResponse {
  ingredient: string;
  quantityReceived: number;
  success: boolean;
}

export interface PurchaseDTO {
  id: string;
  ingredient: string;
  quantityReceived: number;
  requestedAt: string;
  success: boolean;
}
