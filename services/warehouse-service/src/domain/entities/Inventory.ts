export const INITIAL_INGREDIENTS = [
  'tomato',
  'lemon',
  'potato',
  'rice',
  'ketchup',
  'lettuce',
  'onion',
  'cheese',
  'meat',
  'chicken',
] as const;

export type Ingredient = (typeof INITIAL_INGREDIENTS)[number];

export const INITIAL_QUANTITY = 5;
export const MAX_STOCK = 20;

export interface InventoryItem {
  id: string;
  ingredient: string;
  quantity: number;
  updatedAt: Date;
}
