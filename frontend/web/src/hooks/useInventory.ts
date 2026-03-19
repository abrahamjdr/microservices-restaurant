'use client';

import { useEffect, useState } from 'react';
import { api, InventoryItem } from '@/lib/api';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const res = await api.get<{ inventory: InventoryItem[] }>('/api/inventory');
      setInventory(res.data.inventory);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, 3000);
    return () => clearInterval(timer);
  }, []);

  return { inventory, loading, refresh: fetch };
}
