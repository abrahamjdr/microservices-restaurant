'use client';

import { OrderDTO } from '@/lib/api';

interface Props {
  orders: OrderDTO[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

export function OrderQueue({ orders }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Active Orders</h2>
        <span className="text-sm text-slate-400">{orders.length} in queue</span>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-400">No active orders</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="text-xs text-slate-400 font-mono">{order.id.slice(0, 8)}...</code>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                {order.totalPlates} plate{order.totalPlates !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1">
                {order.plates.map((plate) => (
                  <span
                    key={plate.id}
                    title={plate.recipeName}
                    className={`text-xs px-2 py-0.5 rounded-full ${statusColors[plate.status]}`}
                  >
                    {plate.recipeName.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
