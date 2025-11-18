'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../components/AuthProvider';
import AdminDashboard from '../../components/AdminDashboard';

type MetricsResponse = {
  orderMetrics: {
    totalSales: number;
    pending: number;
    inKitchen: number;
    inTransit: number;
    delivered: number;
    topItems: Array<{ title: string; revenue: number; orders: number }>;
  };
  sales: {
    daily: { labels: string[]; totals: number[] };
    weekly: { labels: string[]; totals: number[] };
  };
};

export default function AdminPage() {
  const router = useRouter();
  const { user, role, loading, token, refreshToken } = useAdminAuth();
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/signin?callbackUrl=/admin');
      } else if (role !== 'admin') {
        router.replace('/menu');
      }
    }
  }, [loading, user, role, router]);

  const fetchMetrics = async () => {
    try {
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      setLoadingMetrics(true);
      setError(null);
      const response = await fetch('/api/admin/metrics', {
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
        throw new Error(data.error || 'Failed to load metrics');
      }
      setMetrics(data as MetricsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (!loading && token && user && role === 'admin') {
      void fetchMetrics();
    }
  }, [token, refreshToken, loading, user, role]);

  if (loading || !user || role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-white" data-admin-page>
      {error && (
        <div className="mb-6 rounded-xl border-l-4 border-red-500 bg-red-50/90 px-6 py-4 text-base font-medium text-red-700 shadow-lg">
          {error}
        </div>
      )}
      <AdminDashboard metrics={metrics} loading={loadingMetrics} onRefresh={fetchMetrics} />
    </div>
  );
}

