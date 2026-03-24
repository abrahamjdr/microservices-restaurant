import axios from 'axios';

export interface InventoryAnalysisResult {
  summary: string;
  analysis: InventoryAnalysisItem[];
  analyzedAt: string;
}

export interface InventoryAnalysisItem {
  ingredient: string;
  status: 'critical' | 'low' | 'good' | 'unknown';
  currentStock: number;
  consumptionRatePerHour: number;
  estimatedMinutesRemaining: number | null;
  recommendedRefillQty: number;
  refillNow: boolean;
  insight: string;
}

export class AIAnalysisClient {
  constructor(private readonly aiServiceUrl: string) {}

  async analyze(
    inventory: Record<string, number>,
    consumptionRates: Record<string, { unitsPerHour: number; sampleCount: number }>,
  ): Promise<InventoryAnalysisResult | null> {
    try {
      const response = await axios.post<InventoryAnalysisResult>(
        `${this.aiServiceUrl}/ai/analyze`,
        { inventory, consumptionRates },
        { timeout: 25000 },
      );
      return response.data;
    } catch (err) {
      console.error('[warehouse] AI analysis failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }
}
