export const PLATE_RESERVE_QUEUE = 'plate-reserve';
export const PLATE_RESULT_QUEUE = 'plate-result';

export interface PlateReservationJob {
  plateId: string;
  orderId: string;
  recipeId: number;
  recipeName: string;
  ingredients: Array<{ ingredient: string; quantity: number }>;
}

export interface PlateResultJob {
  plateId: string;
  orderId: string;
  success: boolean;
  message?: string;
}
