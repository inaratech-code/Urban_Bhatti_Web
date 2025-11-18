'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import ProfileForm from '../../components/ProfileForm';
import { useAuth } from '../../components/AuthProvider';

export type OrderDto = {
  _id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    title: string;
    qty: number;
  }>;
};

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  addresses: Array<{
    id: string;
    label: string;
    address: string;
    createdAt?: string;
  }>;
  defaultAddressId: string | null;
  createdAt?: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, token, loading, refreshToken } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/signin?callbackUrl=/dashboard');
      } else if (role === 'admin') {
        router.replace('/admin');
      }
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      setError(null);

      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setError('Authentication required. Please sign in again.');
        setLoadingData(false);
        return;
      }

      try {
        const [profileResponse, ordersResponse] = await Promise.all([
          fetch('/api/profile', {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }),
          fetch('/api/orders', {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          })
        ]);

        const profileJson = await profileResponse.json();
        if (!profileResponse.ok) {
          throw new Error(profileJson.error || 'Failed to load profile');
        }

        const ordersJson = await ordersResponse.json();
        if (!ordersResponse.ok) {
          throw new Error(ordersJson.error || 'Failed to load orders');
        }

        setProfile({
          name: profileJson.name ?? '',
          email: profileJson.email ?? user?.email ?? '',
          phone: profileJson.phone ?? '',
          address: profileJson.address ?? '',
          addresses: Array.isArray(profileJson.addresses) ? profileJson.addresses : [],
          defaultAddressId:
            typeof profileJson.defaultAddressId === 'string' || profileJson.defaultAddressId === null
              ? profileJson.defaultAddressId
              : null,
          createdAt: typeof profileJson.createdAt === 'string' ? profileJson.createdAt : null
        });
        setOrders((ordersJson as any[]).map((order) => ({
          _id: order._id,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          items: Array.isArray(order.items)
            ? order.items.map((item: any) => ({
                title: item.menuItem?.title ?? 'Menu item',
                qty: item.qty ?? 0
              }))
            : []
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoadingData(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, refreshToken]);

  const totalSpent = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);

  if (loading || loadingData) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
        Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-brand-dark">Welcome back, {profile.name || user?.displayName || 'Guest'}</h2>
        <p className="mt-1 text-gray-600">Track your recent orders and keep your delivery preferences up to date.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-orange-50 p-6 text-brand-dark">
            <p className="text-sm uppercase tracking-wide text-brand-dark/70">Total Orders</p>
            <p className="mt-3 text-3xl font-bold">{orders.length}</p>
          </div>
          <div className="rounded-2xl bg-gray-900 p-6 text-orange-100">
            <p className="text-sm uppercase tracking-wide text-orange-200">Total Spent</p>
            <p className="mt-3 text-3xl font-bold">Rs. {totalSpent.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 text-brand-dark shadow-inner">
            <p className="text-sm uppercase tracking-wide text-gray-500">Member Since</p>
            <p className="mt-3 text-3xl font-bold">
              {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <ProfileForm
          profile={profile}
          onUpdated={(updated) => setProfile((prev) => (prev ? { ...prev, ...updated } : prev))}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-brand-dark">Recent Orders</h3>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-3 font-medium text-gray-800">#{order._id.slice(-6)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <ul className="space-y-1">
                        {order.items.map((item, index) => (
                          <li key={`${order._id}-${index}`} className="text-xs">
                            {item.title} × {item.qty}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-brand-dark">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">Rs. {order.total}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      No orders yet. Fill your cart to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

