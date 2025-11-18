import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';

import { getAdminDb } from '../../../lib/firebaseAdmin';
import { requireUser } from '../../../lib/firebaseAdminAuth';

const USERS_COLLECTION = 'users';
type StoredAddress = {
  id: string;
  label: string;
  address: string;
  createdAt?: string;
};

function normalizeAddresses(raw: any): StoredAddress[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: StoredAddress[] = [];
  raw.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const id = typeof item.id === 'string' ? item.id : null;
    const label = typeof item.label === 'string' ? item.label : null;
    const address = typeof item.address === 'string' ? item.address : null;
    if (!id || !address) return;
    cleaned.push({
      id,
      label: label ?? 'Saved address',
      address,
      createdAt:
        typeof item.createdAt === 'string'
          ? item.createdAt
          : typeof item.createdAt === 'number'
          ? new Date(item.createdAt).toISOString()
          : undefined
    });
  });
  return cleaned;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);

    const adminDb = await getAdminDb();
    const docRef = adminDb.collection(USERS_COLLECTION).doc(user.uid);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = snapshot.data() ?? {};
    const createdAtTimestamp = data.createdAt as Timestamp | undefined;
    const addresses = normalizeAddresses(data.addresses);
    const defaultAddressId =
      typeof data.defaultAddressId === 'string'
        ? data.defaultAddressId
        : addresses.length > 0
        ? addresses[0].id
        : null;

    return NextResponse.json(
      {
        name: data.name ?? '',
        email: data.email ?? user.email,
        phone: data.phone ?? '',
        address: data.address ?? '',
        addresses,
        defaultAddressId,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : null
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load profile';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { name, phone, email, defaultAddressId } = body as {
      name?: string;
      phone?: string;
      email?: string;
      defaultAddressId?: string | null;
    };
    const adminDb = await getAdminDb();

    // For email-only updates (from admin settings), name and phone are not required
    if (email && !name && !phone) {
      const docRef = adminDb.collection(USERS_COLLECTION).doc(user.uid);
      const snapshot = await docRef.get();
      const existingData = snapshot.data();
      
      if (snapshot.exists) {
        await docRef.update({ email });
      } else {
        await docRef.set({
          email,
          name: existingData?.name ?? '',
          phone: existingData?.phone ?? ''
        });
      }
      
      // Get updated data
      const updatedSnapshot = await docRef.get();
      const updatedData = updatedSnapshot.data() ?? {};
      
      return NextResponse.json(
        {
          email,
          name: updatedData.name ?? '',
          phone: updatedData.phone ?? '',
          addresses: normalizeAddresses(updatedData.addresses),
          defaultAddressId: updatedData.defaultAddressId ?? null
        },
        { status: 200 }
      );
    }

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const docRef = adminDb.collection(USERS_COLLECTION).doc(user.uid);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      await docRef.set({
        name,
        phone,
        email: email ?? user.email ?? '',
        defaultAddressId: defaultAddressId ?? null
      });
    } else {
      const updates: Record<string, unknown> = { name, phone };

      if (email) {
        updates.email = email;
      }

      if (
        defaultAddressId === null ||
        typeof defaultAddressId === 'string'
      ) {
        updates.defaultAddressId = defaultAddressId;
      }

      await docRef.set(updates, { merge: true });
    }

    const updatedSnapshot = await docRef.get();
    const data = updatedSnapshot.data() ?? {};
    const addresses = normalizeAddresses(data.addresses);

    return NextResponse.json(
      {
        name,
        email: email ?? data.email ?? user.email,
        phone,
        addresses,
        defaultAddressId:
          typeof data.defaultAddressId === 'string'
            ? data.defaultAddressId
            : defaultAddressId ?? null
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

