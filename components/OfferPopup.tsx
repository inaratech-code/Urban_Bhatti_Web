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

function hasSeenOffer(id: string) {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(`ub:offer-popup:${id}`) === 'seen';
}

function markOfferSeen(id: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`ub:offer-popup:${id}`, 'seen');
}

export default function OfferPopup() {
  const pathname = usePathname();
  const [offer, setOffer] = useState<PublicOffer | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch('/api/offers', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) return;
        const list: PublicOffer[] = Array.isArray(data) ? data : [];
        const withImage = list.find((entry) => entry.imageUrl && !hasSeenOffer(entry._id));
        if (withImage) {
          setOffer(withImage);
        }
      } catch {
        // ignore for users
      }
    };

    void fetchOffers();
  }, []);

  const isAdminRoute = pathname?.startsWith('/admin');
  if (isAdminRoute || !offer) return null;

  const handleClose = () => {
    markOfferSeen(offer._id);
    setOffer(null);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 perspective-[1200px]">
      <div className="ub-3d-pop relative max-w-md rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white hover:bg-black/80"
        >
          Close
        </button>
        {offer.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offer.imageUrl}
            alt={offer.title}
            className="h-56 w-full rounded-t-3xl object-cover"
          />
        )}
        <div className="space-y-2 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Special Offer
          </p>
          <h2 className="text-lg font-semibold text-gray-900">{offer.title}</h2>
          {offer.highlight && (
            <p className="text-sm font-semibold text-amber-700">{offer.highlight}</p>
          )}
          {offer.description && (
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {offer.description}
            </p>
          )}
          {(offer.validFrom || offer.validTo) && (
            <p className="text-[11px] text-gray-400">
              {offer.validFrom && `From ${offer.validFrom}`}
              {offer.validFrom && offer.validTo && ' · '}
              {offer.validTo && `Until ${offer.validTo}`}
            </p>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="mt-2 w-full rounded-full bg-brand-orange px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-dark"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}


