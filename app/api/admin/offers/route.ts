import { NextResponse } from 'next/server';

import { requireAdminUser } from '../../../../lib/firebaseAdminAuth';
import { getAdminDb } from '../../../../lib/firebaseAdmin';

type OfferPayload = {
  title?: string;
  description?: string;
  highlight?: string;
  imageUrl?: string;
  validFrom?: string | null;
  validTo?: string | null;
  isActive?: boolean;
};

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const adminDb = await getAdminDb();

    const snapshot = await adminDb
      .collection('offers')
      .orderBy('createdAt', 'desc')
      .get();

    const offers = snapshot.docs.map((doc) => {
      const data = doc.data() as OfferPayload & {
        createdAt?: { toDate?: () => Date };
      };

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
    });

    return NextResponse.json(offers, { status: 200 });
  } catch (error) {
    console.error('Failed to load offers', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load offers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const adminDb = await getAdminDb();
    const body = (await request.json()) as OfferPayload;

    const title = (body.title ?? '').trim();
    const description = (body.description ?? '').trim();
    const highlight = (body.highlight ?? '').trim();
    const imageUrl = (body.imageUrl ?? '').trim();
    const validFrom = body.validFrom ?? null;
    const validTo = body.validTo ?? null;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const docRef = await adminDb.collection('offers').add({
      title,
      description,
      highlight,
      imageUrl,
      validFrom,
      validTo,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString()
    });

    const created = await docRef.get();
    return NextResponse.json({ _id: created.id, ...created.data() }, { status: 201 });
  } catch (error) {
    console.error('Failed to create offer', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminUser(request);
    const adminDb = await getAdminDb();

    const body = (await request.json()) as { id?: string } & OfferPayload;
    const { id, ...payload } = body;

    if (!id) {
      return NextResponse.json({ error: 'Offer id is required' }, { status: 400 });
    }

    const cleanPayload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        cleanPayload[key] = value;
      }
    }

    if (Object.keys(cleanPayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const docRef = adminDb.collection('offers').doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    await docRef.update(cleanPayload);
    const updated = await docRef.get();

    return NextResponse.json({ _id: updated.id, ...updated.data() }, { status: 200 });
  } catch (error) {
    console.error('Failed to update offer', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminUser(request);
    const adminDb = await getAdminDb();

    const body = (await request.json()) as { id?: string };
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Offer id is required' }, { status: 400 });
    }

    const docRef = adminDb.collection('offers').doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ message: 'Offer deleted' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete offer', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
  }
}


