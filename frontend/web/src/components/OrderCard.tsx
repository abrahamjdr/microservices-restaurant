'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface Props {
  onOrderPlaced: () => void;
}

export function OrderCard({ onOrderPlaced }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = async () => {
    if (loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        await api.post('/api/orders', { quantity });
        onOrderPlaced();
        setFlash(true);
        setQuantity(1);
        setTimeout(() => setFlash(false), 1000);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const label = loading
    ? 'Enviando…'
    : flash
      ? '✓ ¡Enviado!'
      : quantity > 1
        ? `Enviar ${quantity} Pedidos`
        : 'Enviar Pedido';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 h-full">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Nuevo Pedido</h2>
        <p className="text-xs text-slate-400 mt-0.5">La cocina elige una receta al azar</p>
      </div>

      {/* Quantity stepper */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-600">
          Ingrese la cantidad de platos a solicitar
        </span>
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-orange-600 font-bold text-lg transition-colors"
          >
            −
          </button>
          <span className="font-bold text-2xl text-slate-900 tabular-nums">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
            className="w-9 h-9 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-orange-600 font-bold text-lg transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full h-12 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
          flash
            ? 'bg-emerald-500 shadow-emerald-200'
            : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5'
        }`}
      >
        {label}
      </button>

      {/* Footer note */}
      <p className="text-[10px] text-slate-400 text-center leading-relaxed mt-auto uppercase tracking-wide">
        Asíncrono · cocina automatizada
      </p>
    </div>
  );
}
