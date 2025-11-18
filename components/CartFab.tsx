'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './Cart';
import { useAuth, useAdminAuth } from './AuthProvider';

export default function CartFab() {
  const { role: customerRole } = useAuth();
  const { user: adminUser } = useAdminAuth();
  const pathname = usePathname();
  const isCartPage = pathname === '/cart';
  const isSigninPage = pathname === '/signin';
  const isSignupPage = pathname === '/signup';
  const isResetPasswordPage = pathname === '/reset-password';
  const { items, subtotal } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const isAdminSession = Boolean(adminUser) || customerRole === 'admin';

  if (isCartPage || isAdminSession || isSigninPage || isSignupPage || isResetPasswordPage) {
    return null;
  }

  return (
    <Link
      href="/cart"
      className="fixed bottom-8 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#dc2626] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#b91c1c]"
    >
      <span aria-hidden>🛒</span>
      <span>
        {totalItems > 0 ? (
          <span className="inline-flex items-center gap-2">
            Cart
            <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-white/90 px-2 text-xs font-bold text-[#dc2626]">
              {totalItems}
            </span>
          </span>
        ) : (
          'Cart'
        )}
      </span>
      {totalItems > 0 && (
        <span className="text-xs text-white/80">
          Rs. {subtotal.toFixed(0)}
        </span>
      )}
    </Link>
  );
}
