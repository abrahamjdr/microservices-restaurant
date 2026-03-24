'use client';

const RECIPES = [
  {
    id: 1,
    name: 'Arroz con Tomate',
    emoji: '🍅',
    ingredients: ['tomate×2', 'arroz×1', 'cebolla×1'],
  },
  {
    id: 2,
    name: 'Ensalada de Pollo',
    emoji: '🥗',
    ingredients: ['pollo×1', 'lechuga×2', 'limón×1', 'queso×1'],
  },
  { id: 3, name: 'Carne con Papas', emoji: '🥩', ingredients: ['carne×1', 'papa×2', 'ketchup×1'] },
  {
    id: 4,
    name: 'Arroz con Queso y Limón',
    emoji: '🧀',
    ingredients: ['arroz×2', 'queso×2', 'limón×1'],
  },
  {
    id: 5,
    name: 'Hamburguesa Clásica',
    emoji: '🍔',
    ingredients: ['carne×1', 'lechuga×1', 'tomate×1', 'cebolla×1', 'ketchup×1'],
  },
  {
    id: 6,
    name: 'Estofado de Pollo',
    emoji: '🍲',
    ingredients: ['pollo×2', 'papa×1', 'tomate×1', 'cebolla×1'],
  },
];

export function RecipeCards() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-900">Menú de Recetas</h2>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
          {RECIPES.length} recetas
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-72">
        {RECIPES.map((recipe) => (
          <div
            key={recipe.id}
            className="p-3 bg-slate-50 rounded-lg border-l-4 border-l-transparent hover:border-l-orange-500 hover:bg-orange-50/40 transition-all cursor-default"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg leading-none">{recipe.emoji}</span>
              <p className="font-semibold text-sm text-slate-800">{recipe.name}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="text-[10px] bg-white text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide"
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
