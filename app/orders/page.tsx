'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '../../components/AuthProvider';

type OrderStatus = 'Pending' | 'In Kitchen' | 'In Transit' | 'Delivered';

type OrderItem = {
  menuItem?: {
    title: string;
  };
  qty: number;
  price: number;
};

type CustomerOrder = {
  _id: string;
  orderNumber?: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
};

const statusSteps: OrderStatus[] = ['Pending', 'In Kitchen', 'In Transit', 'Delivered'];

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function timeAgo(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function CustomerOrdersPage() {
  const { user, token, loading, refreshToken } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/signin?callbackUrl=/orders');
    }
  }, [loading, user, router]);

  const fetchOrders = useCallback(async () => {
    const authToken = token ?? (await refreshToken(true));
    if (!authToken) {
      setPageError('Authentication required. Please sign in again.');
      return;
    }

    try {
      setLoadingOrders(true);
      setPageError(null);
      const response = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load orders');
      }
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }, [token, refreshToken]);

  useEffect(() => {
    if (user && (token || !loading)) {
      void fetchOrders();
    }
  }, [user, token, loading, fetchOrders]);

  // Listen for order status updates from UserOrderWatcher
  useEffect(() => {
    const handleStatusUpdate = () => {
      void fetchOrders();
    };

    window.addEventListener('user-order-status-updated', handleStatusUpdate);
    return () => {
      window.removeEventListener('user-order-status-updated', handleStatusUpdate);
    };
  }, [fetchOrders]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  );

  return (
    <div className="space-y-3 sm:space-y-6 md:space-y-8 -mx-2 sm:mx-0">
      {/* Header - Zomato/Swiggy Style */}
      <section className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Order Tracking</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Review your recent orders and check their status in real time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchOrders()}
            disabled={loadingOrders}
            className="rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60 transition-colors touch-manipulation mt-2 sm:mt-0 w-full sm:w-auto"
          >
            {loadingOrders ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {pageError && (
        <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 text-xs sm:text-sm text-red-600">
          {pageError}
        </div>
      )}

      {!pageError && sortedOrders.length === 0 && !loadingOrders && (
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 text-center shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">You haven't placed any orders yet.</p>
          <Link
            href="/menu"
            className="inline-flex items-center rounded-lg bg-brand-orange px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-orange-600 transition-colors touch-manipulation"
          >
            Browse Menu
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:gap-4 md:gap-5">
        {sortedOrders.map((order) => (
          <article
            key={order._id}
            className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm overflow-hidden"
          >
            <header className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Order ID</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 break-all">
                  {order.orderNumber ?? `#${order._id.slice(-8).toUpperCase()}`}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Placed</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{formatDateTime(order.createdAt)}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{timeAgo(order.createdAt)}</p>
              </div>
            </header>

            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
              <section>
                <h2 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">
                  Order Items
                </h2>
                <div className="space-y-1.5 sm:space-y-2 bg-gray-50 rounded-lg p-2.5 sm:p-3 md:p-4">
                  {order.items.map((item, index) => (
                    <div key={`${order._id}-${index}`} className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="text-gray-700 break-words flex-1">
                        {item.menuItem?.title ?? 'Menu Item'} × {item.qty}
                      </span>
                      <span className="font-semibold text-gray-900 flex-shrink-0">
                        ₹{(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">
                  Status
                </h2>
                <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
                  {statusSteps.map((step, index) => {
                    const isComplete =
                      statusSteps.indexOf(order.status) > statusSteps.indexOf(step);
                    const isCurrent = order.status === step;
                    return (
                      <div
                        key={step}
                        className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
                      >
                        <span
                          className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border text-[10px] sm:text-xs font-semibold ${
                            isComplete || isCurrent
                              ? 'border-brand-orange bg-brand-orange text-white'
                              : 'border-gray-300 text-gray-400 bg-white'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                            isCurrent
                              ? 'text-brand-orange'
                              : isComplete
                              ? 'text-gray-700'
                              : 'text-gray-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <footer className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="text-xs sm:text-sm text-gray-600">
                Need help?{' '}
                <Link
                  href="mailto:info@urbanbhatti.com"
                  className="font-semibold text-brand-orange hover:text-orange-600"
                >
                  Contact support
                </Link>
              </div>
              <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                ₹{order.total.toFixed(2)}
              </div>
            </footer>
          </article>
        ))}
      </div>

      {loadingOrders && (
        <p className="text-xs sm:text-sm text-gray-500">Loading your orders…</p>
      )}
    </div>
  );
}