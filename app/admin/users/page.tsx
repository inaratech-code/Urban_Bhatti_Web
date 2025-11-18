'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminUserInsights from '../../../components/AdminUserInsights';
import { useAdminAuth } from '../../../components/AuthProvider';

type UserMetrics = {
  activeCustomers24h: number;
  totalVisits: number;
  avgItemsPerOrder: number;
  repeatCustomerRate: number;
  hourlyOrders: Array<{ label: string; count: number; total: number }>;
  recentOrders: Array<{ user: string; total: number; items: number; createdAt: string }>;
  topItems: Array<{ title: string; revenue: number; orders: number }>;
};

const defaultMetrics: UserMetrics = {
  activeCustomers24h: 0,
  totalVisits: 0,
  avgItemsPerOrder: 0,
  repeatCustomerRate: 0,
  hourlyOrders: [],
  recentOrders: [],
  topItems: []
};

export default function AdminUsersPage() {
  const { user, role, token, loading, refreshToken } = useAdminAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<UserMetrics>(defaultMetrics);
  const [error, setError] = useState<string | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/signin?callbackUrl=/admin/users');
      } else if (role !== 'admin') {
        router.replace('/menu');
      }
    }
  }, [loading, user, role, router]);

  const fetchMetrics = async () => {
    const authToken = token ?? (await refreshToken(true));
    if (!authToken) {
      setError('Authentication required. Please sign in again.');
      return;
    }

    try {
      setLoadingMetrics(true);
      setError(null);
      const response = await fetch('/api/admin/user-metrics', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load metrics');
      }
      setMetrics(data as UserMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (token || !loading) {
      void fetchMetrics();
    }
  }, [token, refreshToken, loading]);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white shadow-md overflow-hidden w-full" data-admin-page>
      {/* Header */}
      <section className="bg-gradient-to-r from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] py-8 px-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">User Analytics</h1>
            <p className="text-base text-white/80">
              Track visitor engagement, session duration, and browsing behaviour.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchMetrics()}
            disabled={loadingMetrics}
            className="rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {loadingMetrics ? 'Refreshing…' : 'Refresh'}
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

        <AdminUserInsights metrics={metrics} loading={loadingMetrics} />
      </div>
    </div>
  );
}


