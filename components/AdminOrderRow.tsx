'use client';

import { useState } from 'react';

type OrderStatus = 'Pending' | 'In Kitchen' | 'In Transit' | 'Delivered';

type AdminOrderRowProps = {
  order: {
    _id: string;
    orderNumber?: string;
    user?: {
      name?: string;
      email?: string;
    };
    phone?: string | null;
    address?: string | null;
    location?: { lat: number; lng: number } | null;
    total: number;
    status: OrderStatus;
    createdAt: string;
    items: Array<{
      menuItem?: {
        title: string;
      };
      qty: number;
      price: number;
      note?: string;
    }>;
  };
  onStatusUpdated?: () => void;
  token: string | null;
};

export default function AdminOrderRow({ order, onStatusUpdated, token }: AdminOrderRowProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!order.location) return;

    const mapsUrl = `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`;
    try {
      await navigator.clipboard.writeText(mapsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleUpdate = async (nextStatus: OrderStatus) => {
    if (nextStatus === status) return;
    if (!token) {
      setError('Authentication required. Please sign in again.');
      return;
    }
    setStatus(nextStatus);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: order._id, status: nextStatus })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      setStatus(order.status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="bg-white/80 text-sm text-gray-700 hover:bg-[#fff7ef]">
      <td className="px-5 py-4">
        <div className="font-semibold text-brand-dark">{order.user?.name ?? 'Guest User'}</div>
        {order.user?.email && <div className="text-xs text-gray-500">{order.user.email}</div>}
      </td>
      <td className="px-5 py-4">
        {order.phone ? <span>{order.phone}</span> : <span className="text-xs text-gray-400">No number</span>}
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1">
          {order.address && <span className="text-xs text-gray-600">{order.address}</span>}
          {order.location && (
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                title="Click to open in Google Maps"
              >
                {order.location.lat.toFixed(4)}, {order.location.lng.toFixed(4)}
              </a>
              <button
                type="button"
                onClick={handleCopyLocation}
                className="text-xs text-gray-400 hover:text-blue-600"
                title="Copy Google Maps link"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
          )}
          {!order.address && !order.location && (
            <span className="text-xs text-gray-400">No location details</span>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <ul className="space-y-2 text-xs text-gray-600">
          {order.items.map((item, index) => (
            <li key={`${order._id}-item-${index}`}>
              <div className="font-medium text-brand-dark">
                {item.menuItem?.title ?? 'Item'} × {item.qty}
              </div>
              {item.note && (
                <div className="mt-1 text-xs italic text-gray-500">
                  Note: {item.note}
                </div>
              )}
            </li>
          ))}
        </ul>
      </td>
      <td className="px-5 py-4 font-semibold text-brand-dark">Rs. {order.total.toFixed(2)}</td>
      <td className="px-5 py-4">
        <select
          value={status}
          onChange={(event) => handleUpdate(event.target.value as OrderStatus)}
          disabled={loading}
          className="rounded-full border border-[#f5d3b0] bg-white px-3 py-1 text-sm font-medium text-brand-dark focus:border-brand-orange focus:outline-none"
        >
          <option value="Pending">Pending</option>
          <option value="In Kitchen">In Kitchen</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
        </select>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </td>
      <td className="px-5 py-4 text-sm text-gray-600">
        <div>{new Date(order.createdAt).toLocaleString()}</div>
        <div className="text-xs uppercase tracking-[0.3em] text-[#c18153] font-semibold">
          {order.orderNumber ?? `#${order._id.slice(-8).toUpperCase()}`}
        </div>
      </td>
    </tr>
  );
}
