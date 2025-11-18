'use client';

import AdminMenuManager from '../../../components/AdminMenuManager';
import type { MenuItemDto } from '../../../lib/menu';
import { useAdminAuth } from '../../../components/AuthProvider';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminMenuPage() {
  const { user, role, token, loading, refreshToken } = useAdminAuth();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/signin?callbackUrl=/admin/menu');
      } else if (role !== 'admin') {
        router.replace('/menu');
      }
    }
  }, [loading, user, role, router]);

  const fetchMenuItems = useCallback(async () => {
    const authToken = token ?? (await refreshToken(true));
    if (!authToken) {
      setError('Authentication required. Please sign in again.');
      setLoadingItems(false);
      return;
    }

    try {
      setLoadingItems(true);
      setError(null);
      const response = await fetch('/api/admin/menu', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load menu');
      }
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setLoadingItems(false);
    }
  }, [token, refreshToken]);

  useEffect(() => {
    if (!loading && user && role === 'admin') {
      void fetchMenuItems();
    }
  }, [loading, user, role, fetchMenuItems]);

  if (loading || (!user && !loading)) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
        Checking admin access…
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white shadow-md overflow-hidden w-full" data-admin-page>
      {/* Header */}
      <section className="bg-gradient-to-r from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] py-8 px-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Menu Management</h1>
            <p className="text-base text-white/80">
              Add, edit, and organize your restaurant&apos;s menu items.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchMenuItems()}
            disabled={loadingItems}
            className="rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {loadingItems ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* Content */}
      <div className="px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-xl border-l-4 border-red-500 bg-red-50/90 backdrop-blur-sm px-6 py-4 text-base font-medium text-red-700 shadow-lg">{error}</div>
        )}

        <AdminMenuManager initialMenuItems={menuItems} />
      </div>
    </div>
  );
}
