'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type PublicOffer = {
  _id: string;
  title: string;
  description: string;
  highlight: string;
  imageUrl: string;
  validFrom: string | null;
  validTo: string | null;
};

export default function OffersBanner() {
  const pathname = usePathname();
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch('/api/offers', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load offers');
        }
        setOffers(Array.isArray(data) ? data : []);
      } catch {
        // fail silently for users; admin can see offers in dashboard
      }
    };

    void fetchOffers();
  }, []);

  const isAdminRoute = pathname?.startsWith('/admin');
  if (isAdminRoute || !visible || offers.length === 0) return null;

  const primaryOffer = offers[0];

  return (
    <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white shadow">
            %
          </span>
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-800">
              {primaryOffer.title || 'Limited-time offer'}
            </p>
            {primaryOffer.highlight && (
              <p className="text-[11px] font-semibold text-amber-700 sm:text-xs">
                {primaryOffer.highlight}
              </p>
            )}
            {primaryOffer.description && (
              <p className="text-[11px] text-amber-700/90 sm:text-[11px] line-clamp-1">
                {primaryOffer.description}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ml-2 text-[11px] font-semibold text-amber-600 hover:text-amber-800"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}


