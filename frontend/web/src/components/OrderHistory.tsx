'use client';

import { OrderDTO } from '@/lib/api';

interface Props {
  orders: OrderDTO[];
}

const plateStatusStyle: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-slate-100 text-slate-500',
};

export function OrderHistory({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-4 text-center">Aún no hay órdenes completadas</p>
    );
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {orders.map((order) => {
        const isSuccess = order.status === 'COMPLETED';
        return (
          <div
            key={order.id}
            className={`rounded-xl border-l-4 px-3 py-2.5 ${
              isSuccess
                ? 'border-l-emerald-500 bg-emerald-50 border border-emerald-100'
                : 'border-l-red-500 bg-red-50 border border-red-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <code className="text-[10px] text-slate-400 font-mono">#{order.id.slice(0, 8)}</code>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${isSuccess ? 'text-emerald-700' : 'text-red-600'}`}
                >
                  {isSuccess ? 'Completado' : 'Fallido'}
                </span>
                {order.completedAt && (
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {new Date(order.completedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {order.plates.map((plate) => (
                <span
                  key={plate.id}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${plateStatusStyle[plate.status]}`}
                >
                  {plate.recipeName}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
