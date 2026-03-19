import { RecipeSelector } from '../domain/services/RecipeSelector';
import { RECIPES } from '../domain/entities/Recipe';

describe('RecipeSelector', () => {
  let selector: RecipeSelector;

  beforeEach(() => {
    selector = new RecipeSelector();
  });

  it('selectRandom returns a valid recipe', () => {
    const recipe = selector.selectRandom();
    expect(recipe).toBeDefined();
    expect(recipe.id).toBeGreaterThanOrEqual(1);
    expect(recipe.id).toBeLessThanOrEqual(6);
    expect(recipe.name).toBeTruthy();
    expect(recipe.ingredients.length).toBeGreaterThan(0);
  });

  it('findById returns correct recipe', () => {
    const recipe = selector.findById(1);
    expect(recipe).toBeDefined();
    expect(recipe?.name).toBe('Tomato Rice');
  });

  it('findById returns undefined for invalid id', () => {
    const recipe = selector.findById(999);
    expect(recipe).toBeUndefined();
  });

  it('getAll returns all 6 recipes', () => {
    const recipes = selector.getAll();
    expect(recipes).toHaveLength(6);
  });

  it('selectRandom distributes across all recipes (statistical)', () => {
    const counts = new Map<number, number>();
    for (let i = 0; i < 1000; i++) {
      const r = selector.selectRandom();
      counts.set(r.id, (counts.get(r.id) ?? 0) + 1);
    }
    // All 6 recipes should appear at least once in 1000 trials
    RECIPES.forEach((r) => {
      expect(counts.get(r.id)).toBeGreaterThan(0);
    });
  });
});
