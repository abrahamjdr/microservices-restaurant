'use client';

import { useEffect, useState } from 'react';
import { api, PurchaseDTO } from '@/lib/api';

export function usePurchases() {
  const [purchases, setPurchases] = useState<PurchaseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const res = await api.get<{ purchases: PurchaseDTO[] }>('/api/purchases');
      setPurchases(res.data.purchases);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, 5000);
    return () => clearInterval(timer);
  }, []);

  return { purchases, loading, refresh: fetch };
}
