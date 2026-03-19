'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface Props {
  onOrderPlaced: () => void;
}

export function OrderButton({ onOrderPlaced }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = async () => {
    if (loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setLastOrder(null);
      try {
        const res = await api.post<{ order: { id: string } }>('/api/orders', { quantity });
        setLastOrder(res.data.order.id);
        onOrderPlaced();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to place order');
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Place an Order</h2>
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="quantity" className="text-sm text-slate-500">
            Number of plates
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={50}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Placing...' : 'Order Now'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {lastOrder && (
        <p className="mt-3 text-sm text-green-600">
          Order placed! ID: <code className="font-mono">{lastOrder.slice(0, 8)}...</code>
        </p>
      )}
    </div>
  );
}
