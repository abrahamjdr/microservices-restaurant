'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { OrderDTO, PlateDTO, SSE_URL, api } from '@/lib/api';

export function useOrderStream() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollTimerRef.current = setInterval(fetchAll, 3000);
  }, [fetchAll]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchAll();

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
        stopPolling();
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        // Fall back to polling
        startPolling();
        // Retry SSE after 5s
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      esRef.current?.close();
      stopPolling();
    };
  }, [fetchAll, upsertOrder, startPolling, stopPolling]);

  return { orders, connected };
}
