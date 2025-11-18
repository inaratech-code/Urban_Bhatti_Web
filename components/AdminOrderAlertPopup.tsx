'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from './AuthProvider';

type OrderAlert = {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  phone?: string;
  address?: string;
  items: Array<{
    menuItem?: { title: string };
    qty: number;
    price: number;
    note?: string;
  }>;
};

export default function AdminOrderAlertPopup() {
  const { token, refreshToken, role } = useAdminAuth();
  const router = useRouter();
  const [order, setOrder] = useState<OrderAlert | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Request notification permission on mount
  useEffect(() => {
    if (role !== 'admin' || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const requestPermission = async () => {
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
        } catch (error) {
          console.warn('[OrderAlert] Failed to request notification permission:', error);
        }
      } else {
        setNotificationPermission(Notification.permission);
      }
    };

    void requestPermission();
  }, [role]);

  useEffect(() => {
    if (role !== 'admin') return;

    const handleNewOrder = async () => {
      try {
        setLoading(true);
        const authToken = token ?? (await refreshToken(true));
        if (!authToken) return;

        // Fetch the latest order
        const response = await fetch('/api/admin/orders?limit=1', {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: 'no-store'
        });

        if (!response.ok) return;

        const data = await response.json();
        const latestOrder = Array.isArray(data) && data.length > 0 ? data[0] : null;

        if (latestOrder) {
          setOrder(latestOrder);
          setVisible(true);

          // Show browser notification (desktop notification)
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            notificationPermission === 'granted'
          ) {
            const itemCount = latestOrder.items.reduce((sum: number, item: OrderAlert['items'][0]) => sum + item.qty, 0);
            const customerName = latestOrder.customerName || latestOrder.customerEmail || 'Guest';

            const notification = new Notification('🔔 New Order - Urban Bhatti', {
              body: `Order #${latestOrder._id.slice(-8).toUpperCase()}\n${customerName} - ${itemCount} item${itemCount === 1 ? '' : 's'}\nTotal: Rs. ${latestOrder.total.toFixed(2)}`,
              icon: '/LOGO.jpg',
              badge: '/LOGO.jpg',
              tag: `order-${latestOrder._id}`, // Prevent duplicate notifications
              requireInteraction: false,
              silent: false
            });

            // Click notification to open orders page
            notification.onclick = () => {
              window.focus();
              router.push('/admin/orders');
              notification.close();
            };

            // Auto-close after 10 seconds
            setTimeout(() => {
              notification.close();
            }, 10000);
          }
        }
      } catch (error) {
        console.error('[OrderAlert] Failed to fetch latest order:', error);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('admin-notification', handleNewOrder);

    return () => {
      window.removeEventListener('admin-notification', handleNewOrder);
    };
  }, [token, refreshToken, role, notificationPermission, router]);

  const handleClose = () => {
    setVisible(false);
    setOrder(null);
  };

  const handleViewOrder = () => {
    setVisible(false);
    router.push('/admin/orders');
  };

  if (!visible || !order) return null;

  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-[ub-3d-pop_0.4s_ease-out] rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
        >
          ✕ Close
        </button>

        <div className="rounded-t-3xl bg-gradient-to-r from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">
              🔔
            </div>
            <div>
              <h2 className="text-xl font-bold">New Order Received!</h2>
              <p className="text-sm text-white/80">Order #{order._id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Customer</span>
              <span className="text-sm font-semibold text-gray-900">
                {order.customerName || order.customerEmail || 'Guest'}
              </span>
            </div>
            {order.phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Phone</span>
                <span className="text-sm font-semibold text-gray-900">{order.phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Items</span>
              <span className="text-sm font-semibold text-gray-900">
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-3">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-[#7f1d1d]">Rs. {order.total.toFixed(2)}</span>
            </div>
          </div>

          {order.items.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Order Items</h3>
              <div className="space-y-2">
                {order.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {item.menuItem?.title || 'Item'} × {item.qty}
                      </span>
                      <span className="font-semibold text-gray-900">
                        Rs. {(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                    {item.note && (
                      <div className="mt-1 text-xs italic text-gray-500">
                        Note: {item.note}
                      </div>
                    )}
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="pt-2 text-xs text-gray-500">
                    +{order.items.length - 3} more item{order.items.length - 3 === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>
          )}

          {order.address && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <h3 className="mb-1 text-sm font-semibold text-gray-700">Delivery Address</h3>
              <p className="text-sm text-gray-600">{order.address}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleViewOrder}
              className="flex-1 rounded-full bg-gradient-to-r from-[#7f1d1d] to-[#6b1717] px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-[#991b1b] hover:to-[#7f1d1d]"
            >
              View Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

