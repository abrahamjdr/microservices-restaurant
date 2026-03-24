'use client';

import { useState } from 'react';
import { AIInventoryAnalysis, InventoryRow } from '@/hooks/useAIInventory';
import { api } from '@/lib/api';

interface Props {
  rows: InventoryRow[];
  analysis: AIInventoryAnalysis | null;
  loading: boolean;
  onReset: () => void;
}

const STATUS_CONFIG = {
  critical: {
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    label: 'Crítico',
  },
  low: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    label: 'Bajo',
  },
  good: {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Bueno',
  },
  unknown: {
    border: 'border-l-slate-300',
    badge: 'bg-slate-100 text-slate-500',
    dot: 'bg-slate-300',
    label: '—',
  },
};

/** Convierte una tasa en unidades/hora a un nivel de actividad legible. */
function activityLevel(ratePerHour: number): { label: string; style: string } {
  if (ratePerHour <= 0) return { label: '—', style: 'text-slate-300' };
  if (ratePerHour >= 20) return { label: 'Alta', style: 'text-red-500 font-bold' };
  if (ratePerHour >= 6) return { label: 'Media', style: 'text-amber-500 font-semibold' };
  return { label: 'Baja', style: 'text-emerald-500' };
}

/** Formatea minutos restantes en texto legible: "4 min", "1h 20min", ">3h", "—". */
function formatTimeLeft(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h >= 3) return `>3 h`;
  return m === 0 ? `${h} h` : `${h}h ${m}min`;
}

function IngredientRow({ item }: { item: InventoryRow }) {
  const cfg = STATUS_CONFIG[item.status];
  const activity = activityLevel(item.consumptionRatePerHour);
  const timeLeft = formatTimeLeft(item.estimatedMinutesRemaining);

  return (
    <tr className={`border-l-4 ${cfg.border} hover:bg-slate-50 transition-colors`}>
      <td className="py-2.5 pl-3 pr-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <span className="font-semibold text-slate-800 capitalize text-sm">{item.ingredient}</span>
        </div>
      </td>
      <td className="py-2.5 px-2 text-right">
        <span className="font-bold text-slate-900 tabular-nums">{item.currentStock}</span>
      </td>
      <td className={`py-2.5 px-2 text-right text-xs ${activity.style}`}>{activity.label}</td>
      <td className="py-2.5 px-2 text-right text-slate-500 text-xs tabular-nums">{timeLeft}</td>
      <td className="py-2.5 pl-2 pr-3 text-right">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.badge}`}
        >
          {cfg.label}
        </span>
      </td>
    </tr>
  );
}

export function AIInventoryPanel({ rows, analysis, loading, onReset }: Props) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.post('/api/inventory/reset');
      onReset();
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  };

  const ORDER = { critical: 0, low: 1, good: 2, unknown: 3 };
  const sorted = [...rows].sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  const goodCount = rows.filter((r) => r.status === 'good').length;
  const healthIndex = rows.length > 0 ? Math.round((goodCount / rows.length) * 100) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-bold text-slate-900">Inventario Inteligente con IA</h2>
          <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-black tracking-widest border border-blue-100 uppercase">
            GPT-4o
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {healthIndex !== null && (
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center shadow-sm shadow-blue-200">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-80 leading-tight">
                Salud
              </p>
              <p className="text-xl font-black tabular-nums leading-tight">{healthIndex}%</p>
            </div>
          )}
          <button
            onClick={handleReset}
            disabled={resetting}
            title="Restablecer todo el stock a la base (5 unidades cada uno)"
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-40 border border-slate-200"
          >
            {resetting ? 'Restableciendo…' : '↺ Restablecer Stock'}
          </button>
        </div>
      </div>

      {/* AI Summary */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
        {analysis ? (
          <>
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800">Resumen: </span>
              {analysis.summary}
            </p>
            <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wide">
              Actualizado {new Date(analysis.analyzedAt).toLocaleTimeString()}
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-400">
            {loading
              ? 'Cargando análisis IA…'
              : 'El análisis IA inicia después del primer pedido procesado.'}
          </p>
        )}
      </div>

      {/* Table */}
      {loading && sorted.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 bg-slate-50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                <th className="pb-2 pl-3 pr-2 text-left">Ingrediente</th>
                <th className="pb-2 px-2 text-right">Cant.</th>
                <th className="pb-2 px-2 text-right">Demanda</th>
                <th className="pb-2 px-2 text-right">Agota en</th>
                <th className="pb-2 px-2 text-right">Estado</th>
              </tr>
            </thead>
          </table>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full">
              <tbody className="divide-y divide-slate-50">
                {sorted.map((item) => (
                  <IngredientRow key={item.ingredient} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Legend */}
      {sorted.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Crítico
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Bajo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Bueno
          </span>
          <span className="ml-auto text-[9px] text-slate-300">
            Reabastecimiento: Solo IA · máx. 20 unidades
          </span>
        </div>
      )}
    </div>
  );
}
