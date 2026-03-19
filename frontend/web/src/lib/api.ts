import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const SSE_URL = `${API_URL}/api/orders/stream`;

export interface OrderDTO {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalPlates: number;
  createdAt: string;
  completedAt: string | null;
  plates: PlateDTO[];
}

export interface PlateDTO {
  id: string;
  orderId: string;
  recipeId: number;
  recipeName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt: string | null;
}

export interface InventoryItem {
  ingredient: string;
  quantity: number;
  updatedAt: string;
}

export interface PurchaseDTO {
  id: string;
  ingredient: string;
  quantityReceived: number;
  requestedAt: string;
  success: boolean;
}

export interface RecipeDTO {
  id: number;
  name: string;
  ingredients: Array<{ ingredient: string; quantity: number }>;
}

export interface AIRecommendation {
  recipeId: number;
  recipeName: string;
  score: number;
  reasoning: string;
}
