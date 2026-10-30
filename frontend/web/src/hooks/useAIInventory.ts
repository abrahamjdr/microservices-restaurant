import { useEffect, useState, useCallback } from 'react';
import { api, InventoryItem } from '@/lib/api';
import { usePolling } from './usePolling';

export interface IngredientAnalysis {
  ingredient: string;
  status: 'critical' | 'low' | 'good' | 'unknown';
  currentStock: number;
  consumptionRatePerHour: number;
  estimatedMinutesRemaining: number | null;
  recommendedRefillQty: number;
  refillNow: boolean;
  insight: string;
}

export interface AIInventoryAnalysis {
  summary: string;
  analysis: IngredientAnalysis[];
  analyzedAt: string;
}

// Merged view: always has inventory, AI data enriches it when available
export interface InventoryRow {
  ingredient: string;
  currentStock: number;
  status: 'critical' | 'low' | 'good' | 'unknown';
  consumptionRatePerHour: number;
  estimatedMinutesRemaining: number | null;
  refillNow: boolean;
  insight: string;
}

export function useAIInventory(refreshTrigger: number) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [analysis, setAnalysis] = useState<AIInventoryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await api.get<{ inventory: InventoryItem[] }>('/api/inventory');
      setInventory(res.data.inventory);
    } catch {
      // keep last known
    }
  }, []);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await api.get<{ analysis: AIInventoryAnalysis | null }>(
        '/api/inventory/analysis',
      );
      if (res.data.analysis) setAnalysis(res.data.analysis);
    } catch {
      // keep last known
    }
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([fetchInventory(), fetchAnalysis()]).finally(() => setLoading(false));
  }, [fetchInventory, fetchAnalysis, refreshTrigger]);

  // Inventory reflects purchases; analysis is async and expensive, so slower
  usePolling(fetchInventory, 10000);
  usePolling(fetchAnalysis, 20000);

  // Merge: inventory is ground truth for stock. The analysis is a snapshot that only refreshes
  // when a plate is processed, so its status/minutes are used only while its stock still
  // matches; otherwise status is derived from live stock (same thresholds as FallbackAnalyzer).
  const aiByIngredient = new Map(analysis?.analysis.map((a) => [a.ingredient, a]) ?? []);

  const rows: InventoryRow[] = inventory.map((item) => {
    const ai = aiByIngredient.get(item.ingredient);
    const fresh = ai !== undefined && ai.currentStock === item.quantity;
    const rate = ai?.consumptionRatePerHour ?? 0;
    const liveStatus = item.quantity === 0 ? 'critical' : item.quantity <= 3 ? 'low' : 'good';
    return {
      ingredient: item.ingredient,
      currentStock: item.quantity,
      status: fresh ? ai.status : liveStatus,
      consumptionRatePerHour: rate,
      estimatedMinutesRemaining: fresh
        ? ai.estimatedMinutesRemaining
        : rate > 0
          ? Math.round((item.quantity / rate) * 60)
          : null,
      refillNow: fresh ? ai.refillNow : item.quantity === 0,
      insight: fresh ? ai.insight : '',
    };
  });

  return { rows, analysis, loading };
}
