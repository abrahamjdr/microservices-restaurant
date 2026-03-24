export type IngredientStatus = 'critical' | 'low' | 'good' | 'unknown';

export interface IngredientAnalysis {
  ingredient: string;
  status: IngredientStatus;
  currentStock: number;
  consumptionRatePerHour: number;
  estimatedMinutesRemaining: number | null;
  recommendedRefillQty: number;
  refillNow: boolean;
  insight: string;
}

export interface AIInventoryAnalysisResult {
  summary: string;
  analysis: IngredientAnalysis[];
  analyzedAt: string;
}
