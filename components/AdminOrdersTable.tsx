'use client';

import { useMemo } from 'react';

import AdminOrderRow from './AdminOrderRow';

type OrderStatus = 'Pending' | 'In Kitchen' | 'In Transit' | 'Delivered';

export type AdminOrderDto = {
  _id: string;
  orderNumber?: string;
  total: number;
  status: OrderStatus;
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

type AdminOrdersTableProps = {
  orders: AdminOrderDto[];
  loading: boolean;
  message: string | null;
  onRefresh: (showToast?: boolean) => Promise<void> | void;
  token: string | null;
};

export default function AdminOrdersTable({ orders, loading, message, onRefresh, token }: AdminOrdersTableProps) {
  const pendingCount = useMemo(() => orders.filter((order) => order.status === 'Pending').length, [orders]);
  const inKitchenCount = useMemo(() => orders.filter((order) => order.status === 'In Kitchen').length, [orders]);
  const inTransitCount = useMemo(() => orders.filter((order) => order.status === 'In Transit').length, [orders]);
  const deliveredCount = useMemo(() => orders.filter((order) => order.status === 'Delivered').length, [orders]);

  return (
    <div className="relative space-y-4">
      {message && (
        <div className="absolute -top-10 left-1/2 z-20 w-[min(420px,90vw)] -translate-x-1/2 rounded-2xl border border-orange-200 bg-white/95 px-4 py-3 text-sm text-brand-dark shadow-[0_15px_45px_rgba(249,115,22,0.25)] backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="mt-1 text-lg" aria-hidden>
              🔔
            </span>
            <div>
              <p className="font-semibold">Updates</p>
              <p className="text-xs text-gray-600">{message}</p>
            </div>
          </div>
        </div>
      )}
      <section className="rounded-3xl border border-[#f5d3b0] bg-[#fff3eb] px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-brand-dark">Orders</h1>
              <p className="text-sm text-gray-600">Live snapshot of customer orders across every stage.</p>
            </div>
            <button
              type="button"
              onClick={() => onRefresh(true)}
              disabled={loading}
              className="rounded-full border border-brand-orange bg-white/80 px-5 py-2 text-sm font-semibold text-brand-orange hover:bg-brand-orange hover:text-white disabled:opacity-60"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/60 bg-white/70 px-3 py-3 text-center sm:grid-cols-2 lg:grid-cols-4">
            <StatusStat label="Pending" value={pendingCount} tone="orange" />
            <StatusStat label="In Kitchen" value={inKitchenCount} tone="amber" />
            <StatusStat label="In Transit" value={inTransitCount} tone="blue" />
            <StatusStat label="Delivered" value={deliveredCount} tone="emerald" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#fde3d0] text-left text-sm">
                <thead className="bg-[#fef2e5] text-xs uppercase tracking-wide text-[#9b6b45]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Customer</th>
                    <th className="px-4 py-2.5 font-semibold">Number</th>
                    <th className="px-4 py-2.5 font-semibold">Location</th>
                    <th className="px-4 py-2.5 font-semibold">Items</th>
                    <th className="px-4 py-2.5 font-semibold">Total</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8d6b4]">
                  {orders.map((order) => (
                    <AdminOrderRow
                      key={order._id}
                      order={order}
                      token={token}
                      onStatusUpdated={() => onRefresh(true)}
                    />
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-6 text-center text-sm text-gray-500">
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusStat({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: 'orange' | 'amber' | 'blue' | 'emerald';
}) {
  const accentMap: Record<typeof tone, string> = {
    orange: 'text-[#c96a2a]',
    amber: 'text-[#c58b1a]',
    blue: 'text-[#2563eb]',
    emerald: 'text-[#0f9d58]'
  };
  const borderMap: Record<typeof tone, string> = {
    orange: 'border-[#fde3d0]',
    amber: 'border-[#fbe6c2]',
    blue: 'border-[#d8e6ff]',
    emerald: 'border-[#d3f6e6]'
  };
  return (
    <div
      className={`rounded-2xl bg-white/90 px-4 py-5 shadow-[0_6px_20px_rgba(249,115,22,0.08)] ${borderMap[tone]} border`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${accentMap[tone]}`}>{label}</p>
      <p className="mt-3 text-3xl font-bold text-brand-dark">{value}</p>
    </div>
  );
}

