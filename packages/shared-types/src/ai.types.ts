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

export interface AIInventoryAnalysis {
  summary: string;
  analysis: IngredientAnalysis[];
  analyzedAt: string;
}

export interface AIAnalyzeRequest {
  inventory: Record<string, number>;
  consumptionRates: Record<string, { unitsPerHour: number; sampleCount: number }>;
}
