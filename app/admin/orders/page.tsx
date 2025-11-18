'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminOrdersTable from '../../../components/AdminOrdersTable';
import { useAdminAuth } from '../../../components/AuthProvider';

type OrderRow = {
  _id: string;
  total: number;
  status: 'Pending' | 'In Kitchen' | 'In Transit' | 'Delivered';
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
  };
  phone?: string | null;
  address?: string | null;
  location?: { lat: number; lng: number } | null;
  items: Array<{
    menuItem?: {
      title: string;
    };
    qty: number;
    price: number;
  }>;
};

export default function AdminOrdersPage() {
  const { user, role, token, loading, refreshToken } = useAdminAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const pendingCount = useMemo(() => orders.filter((order) => order.status === 'Pending').length, [orders]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/signin?callbackUrl=/admin/orders');
      } else if (role !== 'admin') {
        router.replace('/menu');
      }
    }
  }, [loading, user, role, router]);

  const fetchOrders = async (showToast?: boolean) => {
    try {
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      setLoadingOrders(true);
      setError(null);
      const response = await fetch('/api/admin/orders', {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setError('Authentication expired. Please sign in again.');
        return;
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load orders');
      }
      const list = data as OrderRow[];
      setOrders(list);

      const newIds = new Set(list.map((order) => order._id));
      const previousIds = previousOrderIdsRef.current;
      const hasNewOrder = [...newIds].some((id) => !previousIds.has(id));
      previousOrderIdsRef.current = newIds;

      if (initializedRef.current && hasNewOrder) {
        window.dispatchEvent(new Event('admin-notification'));
        window.dispatchEvent(new Event('play-notification-sound'));
        setToastMessage('New order received.');
      } else if (showToast) {
        setToastMessage('Order list refreshed.');
      }
      initializedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!loading && token) {
      void fetchOrders();
    }
  }, [token, refreshToken, loading]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white shadow-md overflow-hidden w-full" data-admin-page>
      {/* Header */}
      <section className="bg-gradient-to-r from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] py-8 px-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Orders</h1>
            <p className="text-base text-white/80">
              Live snapshot of customer orders across every stage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={loadingOrders}
            className="rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {loadingOrders ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* Content */}
      <div className="px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-xl border-l-4 border-red-500 bg-red-50/90 backdrop-blur-sm px-6 py-4 text-base font-medium text-red-700 shadow-lg">
            {error}
          </div>
        )}
        <AdminOrdersTable
          orders={orders}
          loading={loadingOrders}
          message={toastMessage}
          onRefresh={fetchOrders}
          token={token ?? null}
        />
        {!loadingOrders && pendingCount > 0 && (
          <p className="text-sm text-amber-600">Pending orders awaiting action: {pendingCount}</p>
        )}
        {loadingOrders && <p className="text-base text-gray-500">Loading orders…</p>}
      </div>
    </div>
  );
}
