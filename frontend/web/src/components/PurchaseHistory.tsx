'use client';

import { PurchaseDTO } from '@/lib/api';

interface Props {
  purchases: PurchaseDTO[];
}

export function PurchaseHistory({ purchases }: Props) {
  if (purchases.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">Aún no hay compras al mercado</p>;
  }

  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {purchases.slice(0, 30).map((purchase) => (
        <div
          key={purchase.id}
          className={`flex items-center justify-between px-3 py-2 rounded-lg border-l-4 ${
            purchase.success ? 'bg-emerald-50 border-l-emerald-500' : 'bg-red-50 border-l-red-400'
          }`}
        >
          <span className="capitalize font-semibold text-slate-700 text-sm">
            {purchase.ingredient}
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold tabular-nums ${purchase.success ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {purchase.quantityReceived > 0 ? `+${purchase.quantityReceived}` : '—'}
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                purchase.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {purchase.success ? 'OK' : 'FALLO'}
            </span>
            <span className="text-[10px] text-slate-400 tabular-nums">
              {new Date(purchase.requestedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
