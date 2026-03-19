export interface PromptContext {
  availableIngredients: Record<string, number>;
  orderHistory?: string[];
}

export class PromptBuilder {
  build(context: PromptContext): string {
    const ingredientList = Object.entries(context.availableIngredients)
      .map(([ingredient, qty]) => `  - ${ingredient}: ${qty} units`)
      .join('\n');

    const historySection =
      context.orderHistory && context.orderHistory.length > 0
        ? `\nRecent order history (most popular recipes):\n${context.orderHistory.map((r) => `  - ${r}`).join('\n')}`
        : '';

    return `You are a restaurant AI advisor. Based on the available ingredients, recommend which of the following 6 recipes the kitchen should prioritize making:

1. Tomato Rice (tomato×2, rice×1, onion×1)
2. Chicken Salad (chicken×1, lettuce×2, lemon×1, cheese×1)
3. Meat & Potatoes (meat×1, potato×2, ketchup×1)
4. Cheesy Lemon Rice (rice×2, cheese×2, lemon×1)
5. Classic Burger (meat×1, lettuce×1, tomato×1, onion×1, ketchup×1)
6. Chicken Stew (chicken×2, potato×1, tomato×1, onion×1)

Current inventory:
${ingredientList}
${historySection}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "recommendations": [
    {
      "recipeId": 1,
      "recipeName": "Tomato Rice",
      "score": 95,
      "reasoning": "Has all ingredients with good surplus"
    }
  ]
}

Score each recipe from 0-100 based on ingredient availability. Include all 6 recipes, sorted by score descending.`;
  }
}
