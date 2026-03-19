'use client';

import { OrderDTO } from '@/lib/api';

interface Props {
  orders: OrderDTO[];
}

export function OrderHistory({ orders }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Order History</h2>
        <span className="text-sm text-slate-400">{orders.length} total</span>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-400">No completed orders yet</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {orders.map((order) => {
            const completed = order.plates.filter((p) => p.status === 'COMPLETED').length;
            const failed = order.plates.filter((p) => p.status === 'FAILED').length;
            const isSuccess = order.status === 'COMPLETED';
            return (
              <div
                key={order.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <div>
                  <code className="text-xs text-slate-400 font-mono">{order.id.slice(0, 8)}...</code>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {completed} served, {failed} failed
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-semibold ${isSuccess ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {isSuccess ? 'Completed' : 'Failed'}
                  </span>
                  {order.completedAt && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(order.completedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
