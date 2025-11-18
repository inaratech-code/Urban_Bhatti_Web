import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';

import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAdminUser } from '../../../../lib/firebaseAdminAuth';

const ORDERS_COLLECTION = 'orders';

const ORDER_STATUSES = ['Pending', 'In Kitchen', 'In Transit', 'Delivered'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function normalizeStatus(status: string | undefined): OrderStatus {
  if (!status) return 'Pending';
  const normalized = status.trim().toLowerCase();
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'preparing':
    case 'in kitchen':
    case 'kitchen':
      return 'In Kitchen';
    case 'in transit':
    case 'out for delivery':
    case 'out-for-delivery':
    case 'out_for_delivery':
      return 'In Transit';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Pending';
  }
}

function serializeOrder(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data();
  if (!data) return null;

  const createdAtTimestamp = data.createdAt as Timestamp | undefined;
  const createdAt = createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString();
  const status = normalizeStatus(data.status as string | undefined);

  let location: { lat: number; lng: number } | null = null;
  const rawLocation = data.location as any;
  if (rawLocation) {
    if (typeof rawLocation.latitude === 'number' && typeof rawLocation.longitude === 'number') {
      location = { lat: rawLocation.latitude, lng: rawLocation.longitude };
    } else if (typeof rawLocation.lat === 'number' && typeof rawLocation.lng === 'number') {
      location = { lat: rawLocation.lat, lng: rawLocation.lng };
    }
  }

  // Get order number, fallback to formatted document ID if not present
  const orderNumber = data.orderNumber ?? `#${doc.id.slice(-8).toUpperCase()}`;

  return {
    _id: doc.id,
    orderNumber,
    total: data.total ?? 0,
    status,
    createdAt,
    user: data.userEmail
      ? {
          name: data.userName ?? undefined,
          email: data.userEmail as string
        }
      : undefined,
    phone: data.phone ?? null,
    address: data.address ?? null,
    location,
    items: Array.isArray(data.items)
      ? data.items.map((item: any) => ({
          menuItem: item.menuItem
            ? {
                title: item.menuItem.title ?? 'Menu item'
              }
            : undefined,
          qty: item.qty ?? 0,
          price: item.price ?? 0,
          note: item.note || undefined
        }))
      : []
  };
}

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);

    const adminDb = await getAdminDb();
    const { searchParams } = new URL(request.url);
    const limitParamRaw = searchParams.get('limit');
    const limitParam = limitParamRaw ? Number.parseInt(limitParamRaw, 10) : null;

    let query: FirebaseFirestore.Query = adminDb.collection(ORDERS_COLLECTION).orderBy('createdAt', 'desc');
    if (Number.isFinite(limitParam) && limitParam && limitParam > 0) {
      query = query.limit(Math.min(limitParam, 100));
    }

    const snapshot = await query.get();
    const orders = snapshot.docs
      .map(serializeOrder)
      .filter((order): order is NonNullable<typeof order> => Boolean(order));

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminUser(request);
    const { id, status } = await request.json();
    const adminDb = await getAdminDb();

    if (!id || !status) {
      return NextResponse.json({ error: 'Order id and status are required' }, { status: 400 });
    }

    const normalizedStatus = normalizeStatus(status);

    const docRef = adminDb.collection(ORDERS_COLLECTION).doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await docRef.update({ status: normalizedStatus });
    const updatedSnapshot = await docRef.get();
    const updated = serializeOrder(updatedSnapshot);

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Failed to update order';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

