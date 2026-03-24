'use client';

import { OrderDTO } from '@/lib/api';

interface Props {
  orders: OrderDTO[];
}

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'Cocinando',
  COMPLETED: 'Listo',
  FAILED: 'Fallido',
};

const statusStyle: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-500',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
};

const borderAccent: Record<string, string> = {
  PENDING: 'border-l-slate-300',
  IN_PROGRESS: 'border-l-blue-500',
  COMPLETED: 'border-l-emerald-500',
  FAILED: 'border-l-red-500',
};

const plateStyle: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-500',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
};

export function OrderQueue({ orders }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-900">Cola de Órdenes Activas</h2>
        {orders.length > 0 && (
          <span className="text-[10px] bg-blue-50 text-blue-700 font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">
            {orders.length} en cola
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-300">
          <span className="text-3xl">🍽️</span>
          <span className="text-sm font-medium">Sin órdenes activas</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {orders.map((order) => {
            const completedPlates = order.plates.filter((p) => p.status === 'COMPLETED').length;
            const progress =
              order.plates.length > 0
                ? Math.round((completedPlates / order.plates.length) * 100)
                : 0;

            return (
              <div
                key={order.id}
                className={`border border-slate-100 border-l-4 ${borderAccent[order.status]} rounded-xl px-3 py-3 hover:shadow-sm transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <code className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded">
                    #{order.id.slice(0, 8)}
                  </code>
                  <div className="flex items-center gap-2">
                    {order.status === 'IN_PROGRESS' && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${Math.max(progress, 8)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                          {progress}%
                        </span>
                      </div>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${statusStyle[order.status]}`}
                    >
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {order.plates.map((plate) => (
                    <span
                      key={plate.id}
                      title={plate.recipeName}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${plateStyle[plate.status]}`}
                    >
                      {plate.recipeName.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
