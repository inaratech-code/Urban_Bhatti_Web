import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireUser } from '../../../../lib/firebaseAdminAuth';

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

async function getUserDoc(userId: string) {
  const adminDb = await getAdminDb();
  const docRef = adminDb.collection(USERS_COLLECTION).doc(userId);
  const snapshot = await docRef.get();
  return { docRef, snapshot };
}

function buildResponse(addresses: StoredAddress[], defaultAddressId: string | null) {
  return NextResponse.json(
    {
      addresses,
      defaultAddressId
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const { label, address } = (await request.json()) as { label?: string; address?: string };

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const resolvedLabel =
      typeof label === 'string' && label.trim().length > 0 ? label.trim() : 'Saved address';

    const { docRef, snapshot } = await getUserDoc(user.uid);
    const data = snapshot.data() ?? {};
    const addresses = normalizeAddresses(data.addresses);

    const newAddress: StoredAddress = {
      id: randomUUID(),
      label: resolvedLabel,
      address: address.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedAddresses = [...addresses, newAddress];
    const defaultAddressId =
      typeof data.defaultAddressId === 'string'
        ? data.defaultAddressId
        : newAddress.id;

    const defaultAddress =
      defaultAddressId && updatedAddresses.length > 0
        ? updatedAddresses.find((entry) => entry.id === defaultAddressId)?.address ?? ''
        : updatedAddresses[0]?.address ?? '';

    await docRef.set(
      {
        addresses: updatedAddresses,
        defaultAddressId,
        address: defaultAddress,
        email: data.email ?? user.email ?? ''
      },
      { merge: true }
    );

    return buildResponse(updatedAddresses, defaultAddressId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add address';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const { id, label, address, makeDefault } = (await request.json()) as {
      id?: string;
      label?: string;
      address?: string;
      makeDefault?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'Address id is required' }, { status: 400 });
    }

    const { docRef, snapshot } = await getUserDoc(user.uid);
    const data = snapshot.data() ?? {};
    const addresses = normalizeAddresses(data.addresses);
    const index = addresses.findIndex((item) => item.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (typeof label === 'string' && label.trim()) {
      addresses[index].label = label.trim();
    }
    if (typeof address === 'string' && address.trim()) {
      addresses[index].address = address.trim();
    }

    let defaultAddressId =
      typeof data.defaultAddressId === 'string' ? data.defaultAddressId : null;

    if (makeDefault) {
      defaultAddressId = id;
    } else if (defaultAddressId && !addresses.some((item) => item.id === defaultAddressId)) {
      defaultAddressId = addresses[0]?.id ?? null;
    }

    const defaultAddress =
      defaultAddressId && addresses.length > 0
        ? addresses.find((entry) => entry.id === defaultAddressId)?.address ?? ''
        : addresses[0]?.address ?? '';

    await docRef.set(
      {
        addresses,
        defaultAddressId,
        address: defaultAddress
      },
      { merge: true }
    );

    return buildResponse(addresses, defaultAddressId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update address';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: 'Address id is required' }, { status: 400 });
    }

    const { docRef, snapshot } = await getUserDoc(user.uid);
    const data = snapshot.data() ?? {};
    const addresses = normalizeAddresses(data.addresses);
    const filtered = addresses.filter((item) => item.id !== id);

    let defaultAddressId =
      typeof data.defaultAddressId === 'string' ? data.defaultAddressId : null;
    if (defaultAddressId === id) {
      defaultAddressId = filtered[0]?.id ?? null;
    }

    const defaultAddress =
      defaultAddressId && filtered.length > 0
        ? filtered.find((entry) => entry.id === defaultAddressId)?.address ?? ''
        : filtered[0]?.address ?? '';

    await docRef.set(
      {
        addresses: filtered,
        defaultAddressId,
        address: defaultAddress
      },
      { merge: true }
    );

    return buildResponse(filtered, defaultAddressId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove address';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to remove address' }, { status: 500 });
  }
}


