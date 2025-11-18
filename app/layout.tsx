import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import type { ReactNode } from 'react';

import '../styles/globals.css';
import { Providers } from '../components/Providers';
import Header from '../components/Header';
import Footer from '../components/Footer';
import OffersBanner from '../components/OffersBanner';
import OfferPopup from '../components/OfferPopup';
import CartFab from '../components/CartFab';
import { CartProvider } from '../components/Cart';
import NotificationSoundProvider from '../components/NotificationSoundProvider';
import VisitTracker from '../components/VisitTracker';
import { AuthProvider, AdminAuthProvider } from '../components/AuthProvider';
import PageTransition from '../components/PageTransition';
import AdminOrderWatcher from '../components/AdminOrderWatcher';
import AdminOrderAlertPopup from '../components/AdminOrderAlertPopup';
import UserOrderWatcher from '../components/UserOrderWatcher';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Urban Bhatti | Restaurant Web',
  description: 'Next.js restaurant platform for Urban Bhatti with menu, orders, and admin dashboard.',
  icons: {
    icon: '/LOGO.jpg'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} bg-gray-50 text-gray-900 [&_[data-admin-page]]:bg-transparent`}
      >
        <Providers>
          <AdminAuthProvider>
            <AuthProvider>
            <NotificationSoundProvider>
              <AdminOrderWatcher />
              <AdminOrderAlertPopup />
              <UserOrderWatcher />
              <div className="relative min-h-screen overflow-hidden">
                <VisitTracker />

                <CartProvider>
                  <div className="relative z-10 flex min-h-screen flex-col bg-transparent">
                    <Header />
                    <OffersBanner />
                    <OfferPopup />
                    <main className="flex-1 container mx-auto px-2 sm:px-6 md:px-8 py-2 sm:py-6 md:py-8 max-w-7xl [&_[data-admin-page]]:!px-0 [&_[data-admin-page]]:!max-w-full [&_[data-admin-page]]:!mx-0 [&_[data-admin-page]]:!w-full [&_[data-admin-page]]:!py-0">
                      <div className="relative [&_[data-admin-page]]:relative">
                        <div className="pointer-events-none absolute -top-10 left-12 h-44 w-44 rounded-full bg-brand-orange/15 blur-[90px] [&_[data-admin-page]]:hidden" aria-hidden />
                        <div className="pointer-events-none absolute -bottom-12 right-8 h-52 w-52 rounded-full bg-rose-300/15 blur-[110px] [&_[data-admin-page]]:hidden" aria-hidden />
                        <PageTransition>
                          {children}
                        </PageTransition>
                      </div>
                    </main>
                    <CartFab />
                    <Footer />
                  </div>
                </CartProvider>
              </div>
            </NotificationSoundProvider>
            </AuthProvider>
          </AdminAuthProvider>
        </Providers>
      </body>
    </html>
  );
}


