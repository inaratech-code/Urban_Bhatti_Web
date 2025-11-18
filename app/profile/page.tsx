'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '../../components/AuthProvider';
import ProfileForm from '../../components/ProfileForm';
import AddressBook from '../../components/AddressBook';

type OrderItem = {
  menuItem?: {
    title: string;
  };
  qty: number;
  price: number;
};

type CustomerAddress = {
  id: string;
  label: string;
  address: string;
  createdAt?: string;
};

type OrderResponse = {
  _id: string;
  orderNumber?: string;
  total: number;
  status: 'Pending' | 'In Kitchen' | 'In Transit' | 'Delivered';
  createdAt: string;
  items: OrderItem[];
};

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  addresses: CustomerAddress[];
  defaultAddressId: string | null;
};

export default function ProfilePage() {
  const { user, loading, token, refreshToken } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      setProfileLoading(true);
      setProfileError(null);
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        throw new Error('Please sign in again to view your profile.');
      }
      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }
      setProfile({
        name: data.name ?? '',
        email: data.email ?? user.email ?? '',
        phone: data.phone ?? '',
        addresses: Array.isArray(data.addresses) ? data.addresses : [],
        defaultAddressId: typeof data.defaultAddressId === 'string' ? data.defaultAddressId : null
      });
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }, [user, token, refreshToken]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/signin?callbackUrl=/profile');
    }
  }, [loading, user, router]);

  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    const authToken = token ?? (await refreshToken(true));
    if (!authToken) {
      setOrderError('Please sign in again to view your orders.');
      return;
    }

    try {
      setOrderLoading(true);
      setOrderError(null);
      const response = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load orders');
      }
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Failed to load orders');
    } finally {
      setOrderLoading(false);
    }
  }, [user, token, refreshToken]);

  useEffect(() => {
    if (user) {
      void loadProfile();
      void loadOrders();
    }
  }, [user, loadProfile, loadOrders]);

  // Listen for order status updates from UserOrderWatcher
  useEffect(() => {
    const handleStatusUpdate = () => {
      void loadOrders();
    };

    window.addEventListener('user-order-status-updated', handleStatusUpdate);
    return () => {
      window.removeEventListener('user-order-status-updated', handleStatusUpdate);
    };
  }, [loadOrders]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  );

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([loadProfile(), loadOrders()]);
  }, [loadProfile, loadOrders]);

  return (
    <div className="grid gap-3 sm:gap-6 md:gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] -mx-2 sm:mx-0">
      {/* Profile Section - Zomato/Swiggy Style */}
      <section className="space-y-3 sm:space-y-4 md:space-y-6 bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Update your contact details to speed up future orders.
          </p>
        </div>
        {profileLoading && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
            Loading profile…
          </div>
        )}
        {profileError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-red-600">
            {profileError}
          </div>
        )}
        {!profileLoading && !profileError && profile && (
          <>
            <ProfileForm
              profile={profile}
              onUpdated={(updates) => {
                setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
              }}
            />
            <AddressBook
              addresses={profile.addresses}
              defaultAddressId={profile.defaultAddressId}
              onChange={(data) =>
                setProfile((prev) => (prev ? { ...prev, ...data } : prev))
              }
            />
          </>
        )}
      </section>

      {/* Order History Section - Zomato/Swiggy Style */}
      <section className="space-y-3 sm:space-y-4 md:space-y-5 bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-200 p-3 sm:p-4 md:p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Order History</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Track recent orders and their status.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleRefreshAll()}
            disabled={profileLoading || orderLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors touch-manipulation w-full sm:w-auto"
          >
            <span aria-hidden>⟳</span>
            {profileLoading || orderLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {orderLoading && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
            Loading your orders…
          </div>
        )}

        {orderError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-red-600">
            {orderError}
          </div>
        )}

        {!orderLoading && !orderError && sortedOrders.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
            You haven't placed any orders yet. Browse the menu to get started!
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {sortedOrders.map((order, orderIndex) => {
            const statusColors = {
              'Pending': {
                bg: 'bg-gradient-to-r from-gray-100 to-gray-50',
                text: 'text-gray-700',
                border: 'border-gray-300',
                pulse: 'animate-pulse'
              },
              'In Kitchen': {
                bg: 'bg-gradient-to-r from-amber-100 to-orange-50',
                text: 'text-amber-800',
                border: 'border-amber-300',
                pulse: 'animate-pulse'
              },
              'In Transit': {
                bg: 'bg-gradient-to-r from-blue-100 to-cyan-50',
                text: 'text-blue-800',
                border: 'border-blue-300',
                pulse: 'animate-pulse'
              },
              'Delivered': {
                bg: 'bg-gradient-to-r from-emerald-100 to-green-50',
                text: 'text-emerald-800',
                border: 'border-emerald-300',
                pulse: ''
              }
            };
            const statusStyle = statusColors[order.status] || statusColors['Pending'];
            
            // Different header colors for each order to differentiate them
            const headerColors = [
              { bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', border: 'border-blue-200', accent: 'border-l-4 border-l-blue-500' },
              { bg: 'bg-gradient-to-r from-purple-50 to-pink-50', border: 'border-purple-200', accent: 'border-l-4 border-l-purple-500' },
              { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', border: 'border-amber-200', accent: 'border-l-4 border-l-amber-500' },
              { bg: 'bg-gradient-to-r from-emerald-50 to-teal-50', border: 'border-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
              { bg: 'bg-gradient-to-r from-rose-50 to-red-50', border: 'border-rose-200', accent: 'border-l-4 border-l-rose-500' },
              { bg: 'bg-gradient-to-r from-indigo-50 to-violet-50', border: 'border-indigo-200', accent: 'border-l-4 border-l-indigo-500' },
              { bg: 'bg-gradient-to-r from-orange-50 to-amber-50', border: 'border-orange-200', accent: 'border-l-4 border-l-orange-500' },
              { bg: 'bg-gradient-to-r from-teal-50 to-cyan-50', border: 'border-teal-200', accent: 'border-l-4 border-l-teal-500' }
            ];
            const headerStyle = headerColors[orderIndex % headerColors.length];
            
            return (
              <article
                key={order._id}
                className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-0 sm:p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn overflow-hidden"
                style={{ animationDelay: `${orderIndex * 0.1}s` }}
              >
                <header className={`${headerStyle.bg} ${headerStyle.border} ${headerStyle.accent} space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b rounded-t-lg sm:rounded-t-xl px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 md:pt-5 transition-all duration-300`}>
                  <div className="flex items-start justify-between gap-2 sm:block">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Order ID</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 break-all">
                        {order.orderNumber ?? `#${order._id.slice(-8).toUpperCase()}`}
                      </p>
                    </div>
                    <span
                      className={`sm:hidden flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border-2 ${statusStyle.pulse} transition-all duration-300`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 sm:block sm:text-right">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Placed</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    </div>
                    <span
                      className={`hidden sm:inline-block rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold mt-2 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border-2 ${statusStyle.pulse} transition-all duration-300 shadow-sm`}
                    >
                      {order.status}
                    </span>
                  </div>
                </header>

                {/* Animated Status Progress Bar */}
                <div className="mt-3 sm:mt-4 mb-2 px-3 sm:px-0">
                  <div className="flex items-center justify-between gap-2">
                    {['Pending', 'In Kitchen', 'In Transit', 'Delivered'].map((status, index) => {
                      const statusIndex = ['Pending', 'In Kitchen', 'In Transit', 'Delivered'].indexOf(order.status);
                      const isActive = index <= statusIndex;
                      const isCurrent = index === statusIndex;
                      
                      return (
                        <div key={status} className="flex-1 flex items-center">
                          <div className="flex-1 flex items-center">
                            <div
                              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                                isActive
                                  ? status === 'Delivered'
                                    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                                    : status === 'In Transit'
                                    ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                                    : status === 'In Kitchen'
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                  : 'bg-gray-200'
                              } ${isCurrent ? 'animate-pulse' : ''}`}
                            />
                            {index < 3 && (
                              <div
                                className={`h-2 w-2 rounded-full mx-1 transition-all duration-500 ${
                                  isActive
                                    ? status === 'Delivered'
                                      ? 'bg-emerald-500'
                                      : status === 'In Transit'
                                      ? 'bg-blue-500'
                                      : status === 'In Kitchen'
                                      ? 'bg-amber-500'
                                      : 'bg-gray-500'
                                    : 'bg-gray-300'
                                } ${isCurrent ? 'animate-bounce' : ''}`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[9px] sm:text-[10px] text-gray-500">
                    <span className={order.status === 'Pending' ? 'font-semibold text-gray-700' : ''}>Pending</span>
                    <span className={order.status === 'In Kitchen' ? 'font-semibold text-amber-700' : ''}>Kitchen</span>
                    <span className={order.status === 'In Transit' ? 'font-semibold text-blue-700' : ''}>Transit</span>
                    <span className={order.status === 'Delivered' ? 'font-semibold text-emerald-700' : ''}>Delivered</span>
                  </div>
                </div>

              <div className="mt-3 sm:mt-3 space-y-2 px-3 sm:px-0">
                {order.items.map((item, index) => (
                  <div key={`${order._id}-${index}`} className="flex items-start justify-between gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm text-gray-700 break-words flex-1 leading-relaxed min-w-0">
                      {item.menuItem?.title ?? 'Item'} × {item.qty}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 flex-shrink-0 whitespace-nowrap">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <footer className="mt-3 sm:mt-3 pt-3 sm:pt-3 border-t border-gray-100 flex items-center justify-between gap-2 px-3 sm:px-0 pb-3 sm:pb-0">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Total</span>
                <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900 whitespace-nowrap">₹{order.total.toFixed(2)}</span>
              </footer>
            </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}


