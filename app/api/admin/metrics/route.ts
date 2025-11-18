import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';

import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAdminUser } from '../../../../lib/firebaseAdminAuth';

const ORDERS_COLLECTION = 'orders';
const METRICS_COLLECTION = 'metrics';
const VISITS_DOC = 'visits';

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

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);

    const adminDb = await getAdminDb();
    const [ordersSnapshot, visitsDoc] = await Promise.all([
      adminDb.collection(ORDERS_COLLECTION).orderBy('createdAt', 'desc').get(),
      adminDb.collection(METRICS_COLLECTION).doc(VISITS_DOC).get()
    ]);

    const visitorCount = visitsDoc.exists ? (visitsDoc.data()?.value as number | undefined) ?? 0 : 0;

    const dailyTotals = new Map<string, number>();
    const weeklyTotals = new Map<string, number>();
    let totalSales = 0;
    let pending = 0;
    let inKitchen = 0;
    let inTransit = 0;
    let delivered = 0;
    const itemRevenueMap = new Map<string, { title: string; revenue: number; orders: number }>();

    ordersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp | undefined;
      const createdAt = createdAtTimestamp ? createdAtTimestamp.toDate() : new Date();
      const total = Number(data.total ?? 0);
      const status = normalizeStatus(data.status as string | undefined);

      totalSales += total;
      if (status === 'Pending') pending += 1;
      if (status === 'In Kitchen') inKitchen += 1;
      if (status === 'In Transit') inTransit += 1;
      if (status === 'Delivered') delivered += 1;

      const dayKey = formatDateKey(createdAt);
      dailyTotals.set(dayKey, (dailyTotals.get(dayKey) ?? 0) + total);

      const weekStart = startOfWeek(createdAt);
      const weekKey = formatDateKey(weekStart);
      weeklyTotals.set(weekKey, (weeklyTotals.get(weekKey) ?? 0) + total);

      const items = Array.isArray(data.items) ? data.items : [];
      const seenInOrder = new Set<string>();
      items.forEach((item: any) => {
        const title = String(item?.menuItem?.title ?? 'Menu item');
        const revenue = Number(item?.price ?? 0) * Number(item?.qty ?? 0);
        const entry = itemRevenueMap.get(title) ?? { title, revenue: 0, orders: 0 };
        entry.revenue += revenue;
        if (!seenInOrder.has(title)) {
          entry.orders += 1;
          seenInOrder.add(title);
        }
        itemRevenueMap.set(title, entry);
      });
    });

    const dailyLabels: string[] = [];
    const dailyValues: number[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = formatDateKey(date);
      dailyLabels.push(date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }));
      dailyValues.push(dailyTotals.get(key) ?? 0);
    }

    const weeklyLabels: string[] = [];
    const weeklyValues: number[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const start = startOfWeek(date);
      const key = formatDateKey(start);
      weeklyLabels.push(`Week of ${start.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`);
      weeklyValues.push(weeklyTotals.get(key) ?? 0);
    }

    return NextResponse.json(
      {
        orderMetrics: {
          totalSales,
          pending,
          inKitchen,
          inTransit,
          delivered,
          topItems: Array.from(itemRevenueMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
        },
        sales: {
          daily: { labels: dailyLabels, totals: dailyValues },
          weekly: { labels: weeklyLabels, totals: weeklyValues }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Failed to load metrics';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 });
  }
}
