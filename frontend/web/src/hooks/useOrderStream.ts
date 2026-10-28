'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePolling } from './usePolling';
import { OrderDTO, PlateDTO, SSE_URL, api } from '@/lib/api';

export function useOrderStream() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get<{ orders: OrderDTO[] }>('/api/orders');
      setOrders(res.data.orders);
    } catch {
      // ignore
    }
  }, []);

  const upsertOrder = useCallback((order: OrderDTO) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === order.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = order;
        return next;
      }
      return [order, ...prev];
    });
  }, []);

  // Fallback polling only while SSE is down
  usePolling(fetchAll, 3000, !connected);

  useEffect(() => {
    fetchAll();

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      const es = new EventSource(SSE_URL);
      esRef.current = es;

      es.addEventListener('order_updated', (e: MessageEvent) => {
        const order = JSON.parse(e.data) as OrderDTO;
        upsertOrder(order);
      });

      es.addEventListener('plate_updated', (e: MessageEvent) => {
        const plate = JSON.parse(e.data) as PlateDTO;
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== plate.orderId) return o;
            return { ...o, plates: o.plates.map((p) => (p.id === plate.id ? plate : p)) };
          }),
        );
      });

      es.onopen = () => {
        setConnected(true);
        attempt = 0;
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        // Retry SSE with backoff: 5s, 10s, 20s... capped at 60s
        retryTimer = setTimeout(connect, Math.min(5000 * 2 ** attempt++, 60000));
      };
    };

    connect();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      esRef.current?.close();
    };
  }, [fetchAll, upsertOrder]);

  return { orders, connected };
}
