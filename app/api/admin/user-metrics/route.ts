'use server';

import { Timestamp } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAdminUser } from '../../../../lib/firebaseAdminAuth';

const METRICS_COLLECTION = 'metrics';
const USER_ACTIVITY_DOC = 'userActivity';
const VISITS_DOC = 'visits';

const fallbackMetrics = {
  activeCustomers24h: 0,
  totalVisits: 0,
  avgItemsPerOrder: 0,
  repeatCustomerRate: 0,
  hourlyOrders: [] as Array<{ label: string; count: number; total: number }>,
  recentOrders: [] as Array<{ user: string; total: number; items: number; createdAt: string }>,
  topItems: [] as Array<{ title: string; revenue: number; orders: number }>
};

function formatHour(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);

    const adminDb = await getAdminDb();

    const [visitsSnapshot, ordersSnapshot, userActivitySnapshot] = await Promise.all([
      adminDb.collection(METRICS_COLLECTION).doc(VISITS_DOC).get(),
      adminDb.collection('orders').orderBy('createdAt', 'desc').limit(200).get(),
      adminDb.collection(METRICS_COLLECTION).doc(USER_ACTIVITY_DOC).get()
    ]);

    let totalVisits =
      typeof visitsSnapshot.data()?.value === 'number'
        ? visitsSnapshot.data()!.value
        : fallbackMetrics.totalVisits;

    const now = Date.now();
    const cutoff24h = now - 24 * 60 * 60 * 1000;

    const hourlyMap = new Map<string, { label: string; count: number; total: number }>();
    const userOrderCounts = new Map<string, number>();
    const activeUserIds = new Set<string>();
    const recentOrders: Array<{ user: string; total: number; items: number; createdAt: string }> = [];
    const itemRevenueMap = new Map<string, { title: string; revenue: number; orders: number }>();

    let totalItems = 0;
    const orders = ordersSnapshot.docs;

    for (const doc of orders) {
      const data = doc.data() ?? {};
      const createdAtTimestamp = data.createdAt as Timestamp | undefined;
      const createdAtDate = createdAtTimestamp ? createdAtTimestamp.toDate() : new Date();
      const createdAtISO = createdAtDate.toISOString();
      const createdAtMs = createdAtDate.getTime();

      const orderItems = Array.isArray(data.items) ? data.items : [];
      const itemCount = orderItems.reduce((sum, item) => sum + Number(item?.qty ?? 0), 0);
      const total = Number(data.total ?? 0);
      totalItems += itemCount;

      // Track top items by revenue
      const seenInOrder = new Set<string>();
      orderItems.forEach((item: any) => {
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

      const userId = String(data.userId ?? data.userEmail ?? 'guest');
      userOrderCounts.set(userId, (userOrderCounts.get(userId) ?? 0) + 1);

      if (createdAtMs >= cutoff24h) {
        activeUserIds.add(userId);
      }

      const hourKey = createdAtISO.slice(0, 13);
      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, {
          label: formatHour(createdAtDate),
          count: 0,
          total: 0
        });
      }
      const aggregate = hourlyMap.get(hourKey)!;
      aggregate.count += 1;
      aggregate.total += total;

      if (recentOrders.length < 8) {
        recentOrders.push({
          user: String(data.userName ?? data.userEmail ?? 'Guest'),
          total,
          items: itemCount,
          createdAt: createdAtISO
        });
      }
    }

    const orderCount = orders.length;
    const avgItemsPerOrder =
      orderCount > 0 ? Number((totalItems / orderCount).toFixed(2)) : fallbackMetrics.avgItemsPerOrder;

    const uniqueUsers = userOrderCounts.size;
    const repeatCustomers = Array.from(userOrderCounts.values()).filter((count) => count > 1).length;
    const repeatCustomerRate =
      uniqueUsers > 0
        ? Number(((repeatCustomers / uniqueUsers) * 100).toFixed(1))
        : fallbackMetrics.repeatCustomerRate;

    const hourlyOrders = Array.from(hourlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value)
      .slice(-12); // keep latest 12 hours

    // If there is supplemental user activity data (e.g. from background jobs), merge what is available
    if (userActivitySnapshot.exists) {
      const extra = userActivitySnapshot.data() ?? {};
      if (typeof extra.totalVisits === 'number' && extra.totalVisits > totalVisits) {
        // prefer tracked visits if higher
        totalVisits = extra.totalVisits;
      }
    }

    const topItems = Array.from(itemRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const payload = {
      activeCustomers24h: activeUserIds.size,
      totalVisits,
      avgItemsPerOrder,
      repeatCustomerRate,
      hourlyOrders,
      recentOrders,
      topItems
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('Failed to load user metrics', error);
    return NextResponse.json({ error: 'Failed to load user metrics' }, { status: 500 });
  }
}

