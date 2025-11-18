'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { AdminOrderDto } from '../../components/AdminOrdersTable';
import { useAuth } from '../../components/AuthProvider';

const formatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default function NotificationsPage() {
  const router = useRouter();
  const { user, role, token, loading, refreshToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/signin?callbackUrl=/notifications');
      } else if (role !== 'admin') {
        router.replace('/menu');
      }
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    const loadOrders = async () => {
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      try {
        const response = await fetch('/api/admin/orders', {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load orders');
        }
        const orderList = (data as AdminOrderDto[]).slice(0, 20);
        setOrders(orderList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      }
    };

    loadOrders();
  }, [token, refreshToken]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-dark">Notifications</h1>
        <p className="text-sm text-gray-600">
          Latest order activity and status updates. The bell in the top navigation highlights when new orders arrive.
        </p>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-4">
        {orders.length === 0 && !error && (
          <div className="rounded-3xl border border-dashed border-orange-200 bg-white/80 p-10 text-center text-sm text-gray-500">
            No order activity yet. New orders will appear here.
          </div>
        )}

        {orders.map((order) => (
          <div
            key={order._id}
            className="animate-fade-in-up rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_16px_45px_rgba(15,23,42,0.08)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-400">Order</p>
                <p className="text-lg font-semibold text-brand-dark">#{order._id.slice(-6)}</p>
              </div>
              <div className="rounded-full bg-orange-50 px-4 py-1 text-xs font-semibold text-orange-500">{order.status}</div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-400">Customer</p>
                <p className="text-sm text-gray-700">{order.user?.name ?? 'Guest user'}</p>
                <p className="text-sm text-gray-500">{order.user?.email ?? '—'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-400">Placed</p>
                <p className="text-sm text-gray-700">{formatter.format(new Date(order.createdAt))}</p>
                <p className="text-sm font-semibold text-brand-dark">Total · Rs. {order.total}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Items</p>
              <ul className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                {order.items.map((item, index) => (
                  <li key={`${order._id}-item-${index}`} className="rounded-full bg-white px-3 py-1 shadow">
                    {item.menuItem?.title ?? 'Item'} × {item.qty}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
