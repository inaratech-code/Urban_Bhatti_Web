'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth, useAdminAuth } from './AuthProvider';
import { useCart } from './Cart';

type AdminNotification = {
  id: string;
  message: string;
  createdAt: string;
  href?: string;
};

const MAX_ADMIN_NOTIFICATIONS = 5;

export default function Header() {
  const pathname = usePathname();
  const {
    user: customerUser,
    role: customerRole,
    signOut: signOutCustomer,
    loading: customerLoading
  } = useAuth();
  const {
    user: adminUser,
    role: adminRole,
    signOut: signOutAdmin,
    loading: adminLoading
  } = useAdminAuth();
  const [hasNotifications, setHasNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const isAdminSession = Boolean(adminUser && adminRole === 'admin');
  const activeUser = isAdminSession ? adminUser : customerUser;
  const activeRole = isAdminSession ? adminRole : customerRole;
  const isLoading = customerLoading || adminLoading;
  const { items } = useCart();
  const totalCartItems = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );

  const handleSignOut = useCallback(async () => {
    try {
      if (isAdminSession) {
        await signOutAdmin();
      } else {
        await signOutCustomer();
      }
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  }, [isAdminSession, signOutAdmin, signOutCustomer]);

  const greeting = useMemo(() => {
    if (!activeUser) return null;
    const roleLabel = (activeRole ?? 'guest').toUpperCase();
    
    // For admin users, show restaurant name instead of email
    if (isAdminSession && activeRole === 'admin') {
      return `Urban Bhatti (${roleLabel})`;
    }
    
    const displayName =
      activeUser.displayName ??
      (activeUser.email ? activeUser.email.split('@')[0].replace(/[._-]/g, ' ') : 'Guest');
    return `${displayName}${activeUser.email ? '' : ''} (${roleLabel})`;
  }, [activeRole, activeUser, isAdminSession]);

  const navLinks = useMemo(() => {
    if (isAdminSession) {
      return [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/orders', label: 'Orders' },
        { href: '/admin/offers', label: 'Offers' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/menu', label: 'Menu' },
        { href: '/admin/settings', label: 'Settings' }
      ];
    }
    if (!customerUser) {
      return [
        { href: '/menu', label: 'Menu' },
        { href: '/cart', label: 'Cart' }
      ];
    }
    return [
      { href: '/menu', label: 'Menu' },
      { href: '/orders', label: 'Orders' },
      { href: '/profile', label: 'Profile' },
      { href: '/cart', label: 'Cart' }
    ];
  }, [isAdminSession, customerUser]);

  const pushNotification = useCallback(() => {
    setHasNotifications(true);
    setUnreadCount((count) => Math.min(99, count + 1));
    setNotifications((prev) => {
      const entry: AdminNotification = {
        id: `${Date.now()}`,
        message: `New order received at ${new Date().toLocaleTimeString()}`,
        createdAt: new Date().toISOString(),
        href: '/admin/orders'
      };
      const merged = [entry, ...prev];
      if (merged.length > MAX_ADMIN_NOTIFICATIONS) merged.pop();
      return merged;
    });
  }, []);

  useEffect(() => {
    if (!isAdminSession) {
      setHasNotifications(false);
      setNotificationPanelOpen(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const handler = () => pushNotification();
    const storageHandler = (event: StorageEvent) => {
      if (event.key === 'ub:new-order' && event.newValue) {
        pushNotification();
      }
    };

    window.addEventListener('admin-notification', handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('admin-notification', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [isAdminSession, pushNotification]);

  const handleNotificationClick = useCallback(() => {
    window.dispatchEvent(new Event('play-notification-sound'));
    setHasNotifications(false);
    setNotificationPanelOpen((prev) => {
      const next = !prev;
      if (!prev) {
        setUnreadCount(0);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationPanelOpen(false);
      }
    };

    if (notificationPanelOpen) {
      window.addEventListener('keydown', onEscape);
    }
    return () => window.removeEventListener('keydown', onEscape);
  }, [notificationPanelOpen]);

  const isAdminRoute = pathname?.startsWith('/admin');
  const innerClassName = isAdminRoute
    ? 'flex flex-row items-center justify-between'
    : 'mx-auto flex max-w-6xl flex-col items-center gap-5 md:flex-row md:items-center md:justify-between';

  const navWrapperClasses =
    isAdminSession && isAdminRoute
      ? 'flex items-center gap-3 text-base font-semibold text-[#5b341f] flex-wrap justify-center'
      : 'flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#5b341f] md:text-base';

  const navPillClasses =
    isAdminSession && isAdminRoute ? 'px-5 py-2.5' : 'px-3 py-1.5 md:px-4 md:py-1.5';

  return (
    <header className="relative z-20 border-b-2 border-orange-200/60 bg-white/95 backdrop-blur-xl px-3 py-3 sm:px-4 sm:py-5 shadow-lg">
      <div className={innerClassName}>
        <Link href="/" className="group flex items-center gap-2.5 sm:gap-3 transition-transform hover:scale-105 active:scale-95">
          <span className="relative inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#381808] to-[#5a2a1a] shadow-lg ring-2 ring-orange-200/50">
            <Image
              src="/LOGO.jpg"
              alt="Urban Bhatti logo"
              width={48}
              height={48}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover"
              priority
            />
          </span>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold text-[#381808]">Urban Bhatti</span>
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.35em] text-[#f36a10] font-semibold">Est. 2081</span>
          </div>
        </Link>

        <nav className={navWrapperClasses}>
          {navLinks.map((link) => {
            if (link.href === '/cart' && !isAdminSession) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`motion-link relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-white to-orange-50/50 border border-orange-200/50 ${navPillClasses} font-semibold text-gray-800 shadow-md transition-all hover:bg-gradient-to-r hover:from-brand-orange hover:to-orange-500 hover:text-white hover:border-brand-orange hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f36a10] touch-manipulation`}
                >
                  <span className="text-xs sm:text-sm">{link.label}</span>
                  {totalCartItems > 0 && (
                    <span className="inline-flex h-5 min-w-[1.5rem] sm:h-6 sm:min-w-[1.75rem] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 px-1.5 sm:px-2 text-[10px] sm:text-xs font-bold text-white shadow-lg ring-2 ring-white/50">
                      {totalCartItems}
                    </span>
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`motion-link rounded-full bg-gradient-to-r from-white to-orange-50/50 border border-orange-200/50 ${navPillClasses} font-semibold text-gray-800 shadow-md transition-all hover:bg-gradient-to-r hover:from-brand-orange hover:to-orange-500 hover:text-white hover:border-brand-orange hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f36a10] touch-manipulation text-xs sm:text-sm`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs md:text-sm">
          {isAdminSession && (
            <div className="relative">
              <button
                type="button"
                onClick={handleNotificationClick}
                className="motion-tap relative flex h-9 sm:h-10 items-center justify-center rounded-full bg-white/70 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-[#f36a10]/10 hover:text-[#f36a10] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f36a10] touch-manipulation"
                aria-label="Notifications"
              >
                <span aria-hidden className="text-base sm:text-lg">🔔</span>
                {(hasNotifications || unreadCount > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 inline-flex min-h-[18px] min-w-[18px] sm:min-h-[20px] sm:min-w-[20px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] sm:text-[10px] font-semibold text-white shadow">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationPanelOpen && (
                <div className="absolute right-0 z-30 mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-[320px] rounded-xl sm:rounded-2xl border border-gray-200 bg-white/95 p-3 sm:p-4 text-left text-xs sm:text-sm text-[#3f2a1d] shadow-[0_18px_35px_rgba(59,24,8,0.18)]">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-brand-dark">Notifications</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifications([]);
                        setNotificationPanelOpen(false);
                        setHasNotifications(false);
                        setUnreadCount(0);
                      }}
                      className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500 hover:border-brand-orange hover:text-brand-orange"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {notifications.length === 0 && (
                      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-3 py-4 text-xs text-gray-500">
                        No recent notifications.
                      </p>
                    )}
                    {notifications.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-gray-100 bg-white/80 px-3 py-3 text-xs shadow-sm"
                      >
                        <p className="font-semibold text-brand-dark">{entry.message}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                          {new Date(entry.createdAt).toLocaleTimeString()}
                        </p>
                        {entry.href && (
                          <Link
                            href={entry.href}
                            className="mt-2 inline-flex items-center text-[11px] font-semibold text-brand-orange hover:text-brand-dark"
                            onClick={() => setNotificationPanelOpen(false)}
                          >
                            View details →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isLoading && <span className="text-sm text-gray-500">Checking auth…</span>}

          {!isLoading && isAdminSession && adminUser && (
            <span className="text-sm sm:text-base font-normal text-[#3f2a1d] whitespace-nowrap">
              Urban Bhatti
            </span>
          )}

          {!isLoading && activeUser && (
            <>
              {!isAdminSession && (
                <span className="text-[10px] sm:text-[11px] text-[#3f2a1d] md:text-sm">{greeting}</span>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="motion-tap rounded-full bg-[#f36a10] px-3 sm:px-3.5 py-1.5 text-[10px] sm:text-[11px] font-semibold text-white hover:bg-[#d85a0b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f36a10] touch-manipulation"
              >
                {isAdminSession ? 'Sign Out' : 'Sign Out'}
              </button>
            </>
          )}

          {!isLoading && !isAdminSession && !activeUser && (
            <Link
              href="/signin"
              className="motion-link rounded-full border border-[#f36a10] px-3 sm:px-3.5 py-1.5 text-[10px] sm:text-[11px] font-semibold text-[#f36a10] hover:bg-[#f36a10]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f36a10] touch-manipulation"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

