import { GetRecommendationsUseCase } from '../application/usecases/GetRecommendationsUseCase';
import { ILLMPort } from '../application/ports/ILLMPort';

const mockLLMResponse = JSON.stringify({
  recommendations: [
    { recipeId: 1, recipeName: 'Tomato Rice', score: 90, reasoning: 'Good stock' },
    { recipeId: 2, recipeName: 'Chicken Salad', score: 80, reasoning: 'Sufficient' },
    { recipeId: 3, recipeName: 'Meat & Potatoes', score: 70, reasoning: 'Low stock' },
    { recipeId: 4, recipeName: 'Cheesy Lemon Rice', score: 60, reasoning: 'Moderate' },
    { recipeId: 5, recipeName: 'Classic Burger', score: 50, reasoning: 'Limited' },
    { recipeId: 6, recipeName: 'Chicken Stew', score: 40, reasoning: 'Very low' },
  ],
});

describe('GetRecommendationsUseCase', () => {
  it('returns parsed recommendations from LLM', async () => {
    const llm: ILLMPort = { complete: jest.fn().mockResolvedValue(mockLLMResponse) };
    const useCase = new GetRecommendationsUseCase(llm);

    const result = await useCase.execute({
      availableIngredients: { tomato: 5, rice: 3, onion: 2 },
    });

    expect(result.recommendations).toHaveLength(6);
    expect(result.recommendations[0].recipeId).toBe(1);
    expect(result.generatedAt).toBeTruthy();
  });

  it('passes ingredients and history to LLM', async () => {
    const llm: ILLMPort = { complete: jest.fn().mockResolvedValue(mockLLMResponse) };
    const useCase = new GetRecommendationsUseCase(llm);

    await useCase.execute({
      availableIngredients: { tomato: 5 },
      orderHistory: ['Tomato Rice', 'Chicken Stew'],
    });

    const calledPrompt = (llm.complete as jest.Mock).mock.calls[0][0] as string;
    expect(calledPrompt).toContain('tomato: 5 units');
    expect(calledPrompt).toContain('Tomato Rice');
  });

  it('throws on invalid LLM response', async () => {
    const llm: ILLMPort = { complete: jest.fn().mockResolvedValue('not json') };
    const useCase = new GetRecommendationsUseCase(llm);

    await expect(useCase.execute({ availableIngredients: {} })).rejects.toThrow();
  });
});
