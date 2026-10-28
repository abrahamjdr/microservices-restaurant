'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, PurchaseDTO } from '@/lib/api';
import { usePolling } from './usePolling';

export function usePurchases() {
  const [purchases, setPurchases] = useState<PurchaseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get<{ purchases: PurchaseDTO[] }>('/api/purchases');
      setPurchases(res.data.purchases);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);
  usePolling(fetch, 15000);

  return { purchases, loading, refresh: fetch };
}
