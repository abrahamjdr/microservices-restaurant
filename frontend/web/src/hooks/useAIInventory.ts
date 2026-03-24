import { useEffect, useState, useCallback } from 'react';
import { api, InventoryItem } from '@/lib/api';

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

  // Poll inventory fast (reflects purchases quickly)
  useEffect(() => {
    const t = setInterval(fetchInventory, 3000);
    return () => clearInterval(t);
  }, [fetchInventory]);

  // Poll analysis slower (AI calls are async and expensive)
  useEffect(() => {
    const t = setInterval(fetchAnalysis, 8000);
    return () => clearInterval(t);
  }, [fetchAnalysis]);

  // Merge: inventory is ground truth for stock, AI enriches with status/rates
  const aiByIngredient = new Map(analysis?.analysis.map((a) => [a.ingredient, a]) ?? []);

  const rows: InventoryRow[] = inventory.map((item) => {
    const ai = aiByIngredient.get(item.ingredient);
    return {
      ingredient: item.ingredient,
      currentStock: item.quantity,
      status: ai?.status ?? (item.quantity === 0 ? 'critical' : 'unknown'),
      consumptionRatePerHour: ai?.consumptionRatePerHour ?? 0,
      estimatedMinutesRemaining: ai?.estimatedMinutesRemaining ?? null,
      refillNow: ai ? ai.refillNow : item.quantity === 0,
      insight: ai?.insight ?? '',
    };
  });

  return { rows, analysis, loading };
}
