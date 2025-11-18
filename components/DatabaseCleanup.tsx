'use client';

import { useState } from 'react';
import { useAdminAuth } from './AuthProvider';

type CollectionName = 'orders' | 'menuItems' | 'offers' | 'metrics' | 'users';

type CollectionStats = {
  collections: Record<string, number>;
  message: string;
};

export default function DatabaseCleanup() {
  const { token, refreshToken } = useAdminAuth();
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      const response = await fetch('/api/admin/cleanup', {
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
        throw new Error(data.error || 'Failed to load stats');
      }
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (collectionName: CollectionName) => {
    if (confirmDelete !== collectionName) {
      setConfirmDelete(collectionName);
      return;
    }

    try {
      setDeleting(collectionName);
      setError(null);
      setResult(null);
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      const response = await fetch(
        `/api/admin/cleanup?collection=${collectionName}&confirm=true`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 401) {
        setError('Authentication expired. Please sign in again.');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete collection');
      }

      const resultMessage = data.skipped > 0
        ? `${data.message} (${data.skipped} admin user(s) preserved)`
        : data.message || `Successfully deleted ${data.deleted} documents`;
      
      setResult(resultMessage);
      setConfirmDelete(null);
      // Reload stats after deletion
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
      setConfirmDelete(null);
    } finally {
      setDeleting(null);
    }
  };

  const collections: { name: CollectionName; label: string; deletable: boolean }[] = [
    { name: 'orders', label: 'Orders', deletable: true },
    { name: 'menuItems', label: 'Menu Items', deletable: true },
    { name: 'offers', label: 'Offers', deletable: true },
    { name: 'metrics', label: 'Metrics', deletable: true },
    { name: 'users', label: 'Users', deletable: false }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Database Cleanup</h2>
        <p className="text-sm text-gray-600">
          View collection counts and delete all documents from collections.
          <span className="text-red-600 font-semibold"> ⚠️ This action is irreversible!</span>
        </p>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh Collection Counts'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-600">
          {result}
        </div>
      )}

      {stats && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Collection Counts</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map(({ name, label }) => {
                const total = stats.collections[name] ?? 0;
                const adminCount = stats.collections[`${name}_admin`] ?? 0;
                const regularCount = stats.collections[`${name}_regular`] ?? 0;
                const showBreakdown = name === 'users' && total > 0;
                
                return (
                  <div key={name} className="p-2 bg-white rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{label}:</span>
                      <span className="text-sm font-semibold text-gray-900">{total}</span>
                    </div>
                    {showBreakdown && (
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Regular users:</span>
                          <span className="font-medium">{regularCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Admin users:</span>
                          <span className="font-medium text-blue-600">{adminCount} (preserved)</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="text-sm font-semibold text-red-900 mb-3">Delete Collections</h3>
            <div className="space-y-2">
              {collections.map(({ name, label, deletable }) => {
                const isUsers = name === 'users';
                
                return (
                  <div key={name} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">{label}</span>
                      {!deletable && (
                        <span className="text-xs text-green-600 ml-2 font-semibold">(Protected - All users are safe)</span>
                      )}
                    </div>
                    {deletable ? (
                      <button
                        type="button"
                        onClick={() => deleteCollection(name)}
                        disabled={deleting === name || loading}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                          confirmDelete === name
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } disabled:opacity-60`}
                      >
                        {deleting === name
                          ? 'Deleting...'
                          : confirmDelete === name
                          ? 'Click again to confirm'
                          : 'Delete All'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="rounded-lg px-4 py-1.5 text-xs font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                      >
                        Protected
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {confirmDelete && (
              <p className="mt-3 text-xs text-red-600">
                Click the button again to confirm deletion of{' '}
                {collections.find((c) => c.name === confirmDelete)?.label}.
                <span className="font-semibold"> This action is irreversible!</span>
              </p>
            )}
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-xs text-green-700">
                <span className="font-semibold">✓ Users Collection Protected:</span> All user accounts (both admin and regular) are protected and cannot be deleted through this tool.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

