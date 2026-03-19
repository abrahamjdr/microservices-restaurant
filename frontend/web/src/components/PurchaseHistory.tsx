'use client';

import { PurchaseDTO } from '@/lib/api';

interface Props {
  purchases: PurchaseDTO[];
}

export function PurchaseHistory({ purchases }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Market Purchases</h2>
        <span className="text-sm text-slate-400">{purchases.length} total</span>
      </div>
      {purchases.length === 0 ? (
        <p className="text-sm text-slate-400">No market purchases yet</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {purchases.slice(0, 20).map((purchase) => (
            <div
              key={purchase.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${purchase.success ? 'bg-green-50' : 'bg-red-50'}`}
            >
              <span className="capitalize font-medium text-slate-700">{purchase.ingredient}</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">
                  {purchase.quantityReceived > 0 ? `+${purchase.quantityReceived}` : '0'}
                </span>
                <span
                  className={`text-xs font-semibold ${purchase.success ? 'text-green-600' : 'text-red-600'}`}
                >
                  {purchase.success ? 'OK' : 'FAIL'}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(purchase.requestedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
