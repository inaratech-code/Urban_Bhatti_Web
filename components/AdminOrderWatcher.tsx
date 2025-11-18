'use client';

import { useEffect, useRef } from 'react';

import { useAdminAuth } from './AuthProvider';

const POLL_INTERVAL_MS = 15000;

export default function AdminOrderWatcher() {
  const { user, role, token, refreshToken, loading } = useAdminAuth();
  const latestOrderIdRef = useRef<string | null>(null);
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
    if (!user || role !== 'admin') {
      initializedRef.current = false;
      latestOrderIdRef.current = null;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      try {
        const authToken = token ?? (await refreshToken(true));
        if (!authToken || cancelled) return;

        if (controllerRef.current) {
          controllerRef.current.abort();
        }
        controllerRef.current = new AbortController();

        const response = await fetch('/api/admin/orders?limit=5', {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: 'no-store',
          signal: controllerRef.current.signal
        });

        if (!response.ok) throw new Error('Failed to poll orders');
        const data = (await response.json()) as Array<{ _id?: string | null }>;
        const latestId = data?.[0]?._id ?? null;

        if (!initializedRef.current) {
          initializedRef.current = true;
          latestOrderIdRef.current = latestId;
          return;
        }

        if (latestId && latestId !== latestOrderIdRef.current) {
          latestOrderIdRef.current = latestId;
          window.dispatchEvent(new Event('admin-notification'));
          window.dispatchEvent(new Event('play-notification-sound'));
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        // Swallow other errors silently; we'll retry on next interval.
      } finally {
        if (!cancelled) {
          timeoutRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [user, role, token, refreshToken, loading]);

  return null;
}
