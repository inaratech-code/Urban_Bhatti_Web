import { NextResponse } from 'next/server';

import { getAdminDb } from '../../../lib/firebaseAdmin';

type OfferDoc = {
  title?: string;
  description?: string;
  highlight?: string;
  imageUrl?: string;
  validFrom?: string | null;
  validTo?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

export async function GET() {
  try {
    const adminDb = await getAdminDb();

    const snapshot = await adminDb
      .collection('offers')
      .orderBy('createdAt', 'desc')
      .get();

    const now = new Date();

    const offers = snapshot.docs
      .map((doc) => {
        const data = doc.data() as OfferDoc;

        return {
          _id: doc.id,
          title: data.title ?? '',
          description: data.description ?? '',
          highlight: data.highlight ?? '',
          imageUrl: data.imageUrl ?? '',
          validFrom: data.validFrom ?? null,
          validTo: data.validTo ?? null,
          isActive: data.isActive ?? true
        };
      })
      .filter((offer) => {
        if (!offer.isActive) return false;

        const fromOk =
          !offer.validFrom || new Date(offer.validFrom).getTime() <= now.getTime();
        const toOk =
          !offer.validTo || new Date(offer.validTo).getTime() >= now.getTime();

        return fromOk && toOk;
      });

    return NextResponse.json(offers, { status: 200 });
  } catch (error) {
    console.error('Failed to load public offers', error);
    return NextResponse.json({ error: 'Failed to load offers' }, { status: 500 });
  }
}


