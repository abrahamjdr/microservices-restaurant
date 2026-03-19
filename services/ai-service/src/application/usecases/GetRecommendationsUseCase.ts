import { ILLMPort } from '../ports/ILLMPort';
import { PromptBuilder, PromptContext } from '../../domain/services/PromptBuilder';
import { RecommendationResult } from '../../domain/entities/Recommendation';

export class GetRecommendationsUseCase {
  private readonly promptBuilder = new PromptBuilder();

  constructor(private readonly llmPort: ILLMPort) {}

  async execute(context: PromptContext): Promise<RecommendationResult> {
    const prompt = this.promptBuilder.build(context);
    const rawResponse = await this.llmPort.complete(prompt);

    const parsed = JSON.parse(rawResponse) as {
      recommendations: RecommendationResult['recommendations'];
    };

    return {
      recommendations: parsed.recommendations,
      generatedAt: new Date().toISOString(),
    };
  }
}
