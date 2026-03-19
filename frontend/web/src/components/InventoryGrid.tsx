'use client';

import { InventoryItem } from '@/lib/api';

interface Props {
  inventory: InventoryItem[];
}

function stockColor(qty: number): string {
  if (qty === 0) return 'bg-red-100 border-red-300 text-red-800';
  if (qty <= 3) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
  return 'bg-green-100 border-green-300 text-green-800';
}

export function InventoryGrid({ inventory }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Inventory</h2>
      {inventory.length === 0 ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {inventory.map((item) => (
            <div
              key={item.ingredient}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium ${stockColor(item.quantity)}`}
            >
              <span className="capitalize">{item.ingredient}</span>
              <span className="font-bold">{item.quantity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
