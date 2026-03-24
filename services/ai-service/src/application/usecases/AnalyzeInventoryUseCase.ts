import { ILLMPort } from '../ports/ILLMPort';
import {
  InventoryAnalysisPromptBuilder,
  InventoryAnalysisContext,
} from '../../domain/services/InventoryAnalysisPromptBuilder';
import { AIInventoryAnalysisResult } from '../../domain/entities/InventoryAnalysis';

export class AnalyzeInventoryUseCase {
  private readonly promptBuilder = new InventoryAnalysisPromptBuilder();

  constructor(private readonly llmPort: ILLMPort) {}

  async execute(context: InventoryAnalysisContext): Promise<AIInventoryAnalysisResult> {
    const prompt = this.promptBuilder.build(context);
    const rawResponse = await this.llmPort.complete(prompt);

    const parsed = JSON.parse(rawResponse) as {
      summary: string;
      analysis: AIInventoryAnalysisResult['analysis'];
    };

    return {
      summary: parsed.summary,
      analysis: parsed.analysis,
      analyzedAt: new Date().toISOString(),
    };
  }
}
