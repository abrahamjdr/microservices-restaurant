'use client';

import { useState } from 'react';
import { OrderCard } from '@/components/OrderCard';
import { OrderQueue } from '@/components/OrderQueue';
import { OrderHistory } from '@/components/OrderHistory';
import { PurchaseHistory } from '@/components/PurchaseHistory';
import { RecipeCards } from '@/components/RecipeCards';
import { AIInventoryPanel } from '@/components/AIInventoryPanel';
import { useOrderStream } from '@/hooks/useOrderStream';
import { usePurchases } from '@/hooks/usePurchases';
import { useAIInventory } from '@/hooks/useAIInventory';

export default function Home() {
  const [orderCount, setOrderCount] = useState(0);
  const [historyTab, setHistoryTab] = useState<'orders' | 'market'>('orders');

  const { orders, connected } = useOrderStream();
  const { purchases } = usePurchases();
  const { rows, analysis, loading: aiLoading } = useAIInventory(orderCount);

  const activeOrders = orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'PENDING');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'FAILED');
  const totalCompleted = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalFailed = orders.filter((o) => o.status === 'FAILED').length;

  const onOrderPlaced = () => setOrderCount((n) => n + 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ───────────────────────────────────────────────── */}
      <header className="bg-slate-900 sticky top-0 z-50 shadow-xl h-14 flex items-center justify-between px-6 w-full">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-black">A</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold text-sm">Alegra Restaurant</span>
            <span className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold hidden sm:block">
              Panel de Cocina Automatizada
            </span>
          </div>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <span className="relative flex h-2 w-2">
            {connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-amber-400'}`}
            />
          </span>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            {connected ? 'En vivo' : 'Reconectando'}
          </span>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-5 py-5 space-y-5">
        {/* ── Stats bar ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="En Cola"
            value={activeOrders.length}
            accent="border-l-blue-500"
            icon="⏳"
          />
          <StatCard
            label="Completados"
            value={totalCompleted}
            accent="border-l-emerald-500"
            icon="✅"
          />
          <StatCard label="Fallidos" value={totalFailed} accent="border-l-red-500" icon="❌" />
          <StatCard
            label="Compras"
            value={purchases.length}
            accent="border-l-violet-500"
            icon="🛒"
          />
        </div>

        {/* ── Row 1: New Order | Active Queue | Menu (4/12 each) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <OrderCard onOrderPlaced={onOrderPlaced} />
          <OrderQueue orders={activeOrders} />
          <RecipeCards />
        </div>

        {/* ── Row 2: AI Inventory (6/12) | History tabs (6/12) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <AIInventoryPanel
            rows={rows}
            analysis={analysis}
            loading={aiLoading}
            onReset={onOrderPlaced}
          />

          {/* Tabbed history card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <TabButton
                label="Historial de Órdenes"
                count={completedOrders.length}
                active={historyTab === 'orders'}
                onClick={() => setHistoryTab('orders')}
                first
              />
              <TabButton
                label="Compras al Mercado"
                count={purchases.length}
                active={historyTab === 'market'}
                onClick={() => setHistoryTab('market')}
              />
            </div>
            <div className="p-4">
              {historyTab === 'orders' ? (
                <OrderHistory orders={completedOrders} />
              ) : (
                <PurchaseHistory purchases={purchases} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: string;
}) {
  return (
    <div
      className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${accent} relative overflow-hidden`}
    >
      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">{label}</p>
      <p className="font-bold text-4xl tabular-nums text-slate-900">{value}</p>
      <span className="absolute right-4 bottom-3 text-3xl opacity-10 select-none">{icon}</span>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
  first,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  first?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
        ${first ? 'rounded-tl-xl' : 'rounded-tr-xl'}
        ${
          active
            ? 'text-slate-800 bg-slate-50 border-b-2 border-orange-500'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
          ${active ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
