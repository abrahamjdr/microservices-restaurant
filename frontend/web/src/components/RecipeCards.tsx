'use client';

const RECIPES = [
  { id: 1, name: 'Tomato Rice', ingredients: ['tomato×2', 'rice×1', 'onion×1'] },
  { id: 2, name: 'Chicken Salad', ingredients: ['chicken×1', 'lettuce×2', 'lemon×1', 'cheese×1'] },
  { id: 3, name: 'Meat & Potatoes', ingredients: ['meat×1', 'potato×2', 'ketchup×1'] },
  { id: 4, name: 'Cheesy Lemon Rice', ingredients: ['rice×2', 'cheese×2', 'lemon×1'] },
  { id: 5, name: 'Classic Burger', ingredients: ['meat×1', 'lettuce×1', 'tomato×1', 'onion×1', 'ketchup×1'] },
  { id: 6, name: 'Chicken Stew', ingredients: ['chicken×2', 'potato×1', 'tomato×1', 'onion×1'] },
];

export function RecipeCards() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Recipes</h2>
      <div className="space-y-3">
        {RECIPES.map((recipe) => (
          <div key={recipe.id} className="border border-slate-100 rounded-xl p-3">
            <p className="text-sm font-medium text-slate-800 mb-1">{recipe.name}</p>
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
