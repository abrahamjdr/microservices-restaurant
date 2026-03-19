'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, AIRecommendation, InventoryItem } from '@/lib/api';

export function useAIRecommendations(inventory: InventoryItem[], orderCount: number) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (inventory.length === 0) return;
    setLoading(true);
    try {
      const availableIngredients: Record<string, number> = {};
      inventory.forEach((item) => {
        availableIngredients[item.ingredient] = item.quantity;
      });

      const res = await api.post<{ recommendations: AIRecommendation[]; generatedAt: string }>(
        '/api/ai/recommend',
        { availableIngredients },
      );
      setRecommendations(res.data.recommendations);
      setGeneratedAt(res.data.generatedAt);
    } catch {
      // ignore — AI service may not be configured
    } finally {
      setLoading(false);
    }
  }, [inventory]);

  // Re-fetch when a new order is placed
  useEffect(() => {
    fetch();
  }, [orderCount, fetch]);

  return { recommendations, loading, generatedAt, refresh: fetch };
}
