import axios from 'axios';
import { InventoryAnalysisPromptBuilder } from './InventoryAnalysisPromptBuilder';

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

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
}

/** Calls OpenAI directly. Returns null on any failure so the caller falls back to FallbackAnalyzer. */
export class AIAnalysisClient {
  private readonly promptBuilder = new InventoryAnalysisPromptBuilder();

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4o',
  ) {}

  async analyze(
    inventory: Record<string, number>,
    consumptionRates: Record<string, { unitsPerHour: number; sampleCount: number }>,
  ): Promise<InventoryAnalysisResult | null> {
    if (!this.apiKey) return null;
    try {
      const response = await axios.post<OpenAIResponse>(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            { role: 'user', content: this.promptBuilder.build({ inventory, consumptionRates }) },
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        },
        { headers: { Authorization: `Bearer ${this.apiKey}` }, timeout: 25000 },
      );
      const parsed = JSON.parse(response.data.choices[0].message.content) as {
        summary?: string;
        analysis?: InventoryAnalysisItem[];
      };
      if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.analysis)) {
        throw new Error('unexpected OpenAI response shape');
      }
      return {
        summary: parsed.summary,
        analysis: parsed.analysis,
        analyzedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[warehouse] AI analysis failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }
}
