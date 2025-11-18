'use client';

import { useEffect, useRef } from 'react';

import { useAuth } from './AuthProvider';

const POLL_INTERVAL_MS = 15000; // Poll every 15 seconds (reduced frequency for better mobile performance)

export default function UserOrderWatcher() {
  const { user, token, refreshToken, loading } = useAuth();
  const orderStatusesRef = useRef<Map<string, string>>(new Map());
  const initializedRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      initializedRef.current = false;
      orderStatusesRef.current.clear();
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      return;
    }

    let cancelled = false;
    let isPolling = false;

    const poll = async () => {
      if (cancelled || isPolling) return;
      isPolling = true;

      try {
        const authToken = token ?? (await refreshToken(true));
        if (!authToken || cancelled) {
          isPolling = false;
          return;
        }

        if (controllerRef.current) {
          controllerRef.current.abort();
        }
        controllerRef.current = new AbortController();

        const response = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: 'no-store',
          signal: controllerRef.current.signal
        });

        if (!response.ok) throw new Error('Failed to poll orders');
        const orders = (await response.json()) as Array<{ _id: string; status: string }>;

        if (!initializedRef.current) {
          // Initialize: store current statuses
          orders.forEach((order) => {
            orderStatusesRef.current.set(order._id, order.status);
          });
          initializedRef.current = true;
        } else {
          // Check for status changes
          const statusChanged = orders.some((order) => {
            const previousStatus = orderStatusesRef.current.get(order._id);
            if (previousStatus && previousStatus !== order.status) {
              // Status changed - trigger update
              orderStatusesRef.current.set(order._id, order.status);
              return true;
            } else if (!previousStatus) {
              // New order
              orderStatusesRef.current.set(order._id, order.status);
            }
            return false;
          });

          if (statusChanged) {
            // Dispatch event to trigger UI update (use requestIdleCallback for better performance)
            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
              requestIdleCallback(() => {
                window.dispatchEvent(new CustomEvent('user-order-status-updated'));
              });
            } else {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('user-order-status-updated'));
              }, 0);
            }
          }

          // Update stored statuses
          orders.forEach((order) => {
            orderStatusesRef.current.set(order._id, order.status);
          });
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          isPolling = false;
          return;
        }
        // Swallow other errors silently; we'll retry on next interval.
      } finally {
        isPolling = false;
        if (!cancelled) {
          timeoutRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    // Delay initial poll slightly to avoid blocking initial render
    timeoutRef.current = window.setTimeout(poll, 2000);

    return () => {
      cancelled = true;
      isPolling = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [user, token, refreshToken, loading]);

  return null;
}

