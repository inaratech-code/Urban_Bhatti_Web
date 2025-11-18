import { NextResponse } from 'next/server';
import { FieldPath, FieldValue, Timestamp } from 'firebase-admin/firestore';

import { getAdminDb } from '../../../lib/firebaseAdmin';
import { getUserFromRequest, requireUser } from '../../../lib/firebaseAdminAuth';
import { printOrderReceipt } from '../../../lib/printService';

const MENU_COLLECTION = 'menuItems';
const ORDERS_COLLECTION = 'orders';

const ORDER_STATUSES = ['Pending', 'In Kitchen', 'In Transit', 'Delivered'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function normalizeStatus(status: string | undefined): OrderStatus {
  const normalized = status?.trim().toLowerCase();
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

async function fetchMenuItems(adminDb: FirebaseFirestore.Firestore, menuItemIds: string[]) {
  const map = new Map<string, { title: string; price: number }>();
  if (menuItemIds.length === 0) return map;

  for (let i = 0; i < menuItemIds.length; i += 10) {
    const chunk = menuItemIds.slice(i, i + 10);
    const snapshot = await adminDb
      .collection(MENU_COLLECTION)
      .where(FieldPath.documentId(), 'in', chunk)
      .get();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      map.set(doc.id, {
        title: data.title ?? 'Menu item',
        price: data.price ?? 0
      });
    });
  }

  return map;
}

function serializeOrder(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data();
  if (!data) return null;

  const createdAtTimestamp = data.createdAt as Timestamp | undefined;
  const createdAt = createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString();

  // Get order number, fallback to formatted document ID if not present
  const orderNumber = data.orderNumber ?? `#${doc.id.slice(-8).toUpperCase()}`;

  return {
    _id: doc.id,
    orderNumber,
    total: data.total ?? 0,
    status: normalizeStatus(data.status as string | undefined),
    createdAt,
    user: data.userEmail
      ? {
          name: data.userName ?? undefined,
          email: data.userEmail as string
        }
      : undefined,
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
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Admins should use admin orders endpoint' }, { status: 403 });
    }

    const adminDb = await getAdminDb();
    const snapshot = await adminDb
      .collection(ORDERS_COLLECTION)
      .where('userId', '==', user.uid)
      .get();

    const orders = snapshot.docs
      .map(serializeOrder)
      .filter((order): order is NonNullable<typeof order> => Boolean(order))
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Admins should use admin orders endpoint' }, { status: 403 });
    }

    const adminDb = await getAdminDb();
    const body = await request.json();
    const { items, address, phone, location } = body as {
      items: Array<{ menuItemId: string; qty: number; note?: string }>;
      address: string;
      phone: string;
      location?: { lat: number; lng: number };
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    if (!address || !phone) {
      return NextResponse.json({ error: 'Address and phone are required' }, { status: 400 });
    }

    const ids = items.map((item) => item.menuItemId);
    const menuItemMap = await fetchMenuItems(adminDb, ids);

    // Filter out invalid/fallback items that don't exist in the database
    const validItems: typeof items = [];
    const invalidItems: string[] = [];

    items.forEach((cartItem) => {
      const menuItem = menuItemMap.get(cartItem.menuItemId);
      if (!menuItem) {
        // Check if it's a fallback item (starts with "fallback-")
        if (cartItem.menuItemId.startsWith('fallback-')) {
          invalidItems.push(cartItem.menuItemId);
        } else {
          invalidItems.push(cartItem.menuItemId);
        }
      } else {
        validItems.push(cartItem);
      }
    });

    // If all items are invalid, return an error
    if (validItems.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid menu items found in cart. Please refresh the menu and add items again.',
          invalidItems 
        },
        { status: 400 }
      );
    }

    // If some items are invalid, warn but proceed with valid items
    if (invalidItems.length > 0) {
      console.warn(`Some items in cart are invalid and will be skipped:`, invalidItems);
    }

    const orderItems = validItems.map((cartItem) => {
      const menuItem = menuItemMap.get(cartItem.menuItemId);
      // This should never be null now, but add safety check
      if (!menuItem) {
        throw new Error(`Menu item not found: ${cartItem.menuItemId}`);
      }
      return {
        qty: cartItem.qty,
        price: menuItem.price,
        menuItemId: cartItem.menuItemId,
        menuItem,
        note: cartItem.note || null
      };
    });

    const total = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    const userProfileSnapshot = await adminDb.collection('users').doc(user.uid).get();
    const userProfile = userProfileSnapshot.exists ? userProfileSnapshot.data() : undefined;

    // Get and increment order number counter
    const counterRef = adminDb.collection('counters').doc('orderNumber');
    const counterDoc = await counterRef.get();
    let orderNumber = 0;
    
    if (counterDoc.exists) {
      const currentValue = counterDoc.data()?.value ?? 0;
      orderNumber = currentValue;
      await counterRef.update({ value: FieldValue.increment(1) });
    } else {
      // Initialize counter at 0
      orderNumber = 0;
      await counterRef.set({ value: 1 });
    }

    // Format order number as #000, #001, etc.
    const formattedOrderNumber = `#${String(orderNumber).padStart(3, '0')}`;

    const orderDocRef = await adminDb.collection(ORDERS_COLLECTION).add({
      userId: user.uid,
      userEmail: user.email ?? null,
      userName: userProfile?.name ?? user.email ?? 'Guest',
      items: orderItems,
      total,
      status: 'Pending',
      address,
      phone,
      location: location ?? null,
      orderNumber: formattedOrderNumber,
      orderNumberValue: orderNumber,
      createdAt: FieldValue.serverTimestamp()
    });

    const createdSnapshot = await orderDocRef.get();
    const createdOrder = serializeOrder(createdSnapshot);

    const orderData = {
      id: orderDocRef.id,
      orderNumber: formattedOrderNumber,
      total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      customerName: userProfile?.name ?? user.email ?? 'Guest',
      customerEmail: user.email ?? null,
      phone,
      address,
      items: orderItems.map((item) => ({
        title: item.menuItem?.title ?? 'Menu item',
        qty: item.qty,
        price: item.price
      }))
    };

    // Print receipt (non-blocking, but log result)
    printOrderReceipt({
      ...orderData,
      customerEmail: orderData.customerEmail ?? undefined
    }).catch((error) => {
      // Log but don't fail the order creation
      console.error('[Orders API] Print receipt failed:', error);
    });

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Failed to create order';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

