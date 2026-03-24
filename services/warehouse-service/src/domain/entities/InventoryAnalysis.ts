export type IngredientStatus = 'critical' | 'low' | 'good' | 'unknown';

export interface InventoryAnalysisItem {
  ingredient: string;
  status: IngredientStatus;
  currentStock: number;
  consumptionRatePerHour: number;
  estimatedMinutesRemaining: number | null;
  recommendedRefillQty: number;
  refillNow: boolean;
  insight: string;
}

export interface InventoryAnalysis {
  summary: string;
  analysis: InventoryAnalysisItem[];
  analyzedAt: string;
}
