'use client';

import { useState } from 'react';
import { OrderButton } from '@/components/OrderButton';
import { InventoryGrid } from '@/components/InventoryGrid';
import { OrderQueue } from '@/components/OrderQueue';
import { OrderHistory } from '@/components/OrderHistory';
import { PurchaseHistory } from '@/components/PurchaseHistory';
import { RecipeCards } from '@/components/RecipeCards';
import { AIRecommendations } from '@/components/AIRecommendations';
import { useOrderStream } from '@/hooks/useOrderStream';
import { useInventory } from '@/hooks/useInventory';
import { usePurchases } from '@/hooks/usePurchases';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';

export default function Home() {
  const [orderCount, setOrderCount] = useState(0);
  const { orders, connected } = useOrderStream();
  const { inventory } = useInventory();
  const { purchases } = usePurchases();
  const { recommendations, loading: aiLoading, generatedAt } = useAIRecommendations(inventory, orderCount);

  const activeOrders = orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'PENDING');
  const completedOrders = orders.filter(
    (o) => o.status === 'COMPLETED' || o.status === 'FAILED',
  );
  const hasLowStock = inventory.some((i) => i.quantity === 0);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alegra Restaurant</h1>
          <p className="text-slate-500 mt-1">Free food donation day — automated kitchen</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}
          />
          <span className="text-sm text-slate-500">
            {connected ? 'Live updates' : 'Polling mode'}
          </span>
        </div>
      </div>

      {/* Low stock alert */}
      {hasLowStock && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          Some ingredients are out of stock. New orders may fail until restocked.
        </div>
      )}

      {/* Order placement */}
      <div className="mb-8">
        <OrderButton onOrderPlaced={() => setOrderCount((n) => n + 1)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <OrderQueue orders={activeOrders} />
          <OrderHistory orders={completedOrders} />
          <PurchaseHistory purchases={purchases} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <InventoryGrid inventory={inventory} />
          <AIRecommendations
            recommendations={recommendations}
            loading={aiLoading}
            generatedAt={generatedAt}
          />
          <RecipeCards />
        </div>
      </div>
    </main>
  );
}
