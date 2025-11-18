'use client';

import { useMemo } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  type ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

type HourlyOrders = {
  label: string;
  count: number;
  total: number;
};

type RecentOrder = {
  user: string;
  total: number;
  items: number;
  createdAt: string;
};

type AdminUserInsightsProps = {
  metrics: {
    activeCustomers24h: number;
    totalVisits: number;
    avgItemsPerOrder: number;
    repeatCustomerRate: number;
    hourlyOrders: HourlyOrders[];
    recentOrders: RecentOrder[];
    topItems: Array<{ title: string; revenue: number; orders: number }>;
  };
  loading?: boolean;
};

export default function AdminUserInsights({ metrics, loading = false }: AdminUserInsightsProps) {
  const hourlyChartData = useMemo(() => {
    const labels = metrics.hourlyOrders.map((entry) => entry.label);
    return {
      labels,
      datasets: [
        {
          label: 'Orders',
          data: metrics.hourlyOrders.map((entry) => entry.count),
          backgroundColor: 'rgba(249, 115, 22, 0.75)',
          borderRadius: 12,
          barThickness: 26
        }
      ]
    };
  }, [metrics.hourlyOrders]);

  const hourlyChartOptions: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y ?? 0} orders`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b' },
          grid: { display: false }
        },
        y: {
          position: 'left',
          beginAtZero: true,
          ticks: { color: '#94a3b8' },
          title: {
            display: true,
            text: 'Orders',
            color: '#64748b'
          }
        }
      }
    }),
    []
  );

  const recentOrders = useMemo(() => metrics.recentOrders.slice(0, 6), [metrics.recentOrders]);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-4">
        <StatCard title="Active Customers (24h)" value={metrics.activeCustomers24h.toLocaleString()} highlight />
        <StatCard title="Site Visits" value={metrics.totalVisits.toLocaleString()} />
        <StatCard title="Avg Items / Order" value={metrics.avgItemsPerOrder.toFixed(2)} />
        <StatCard title="Repeat Customers" value={`${metrics.repeatCustomerRate.toFixed(1)}%`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl border border-white/60 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.1)]">
          <h2 className="text-lg font-semibold text-brand-dark">Orders by Hour (24h)</h2>
          <p className="text-xs text-gray-500">Track order volume and revenue across the day.</p>
          <div className="mt-3 h-52">
            {metrics.hourlyOrders.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500">
                No orders logged yet.
              </div>
            ) : (
              <Bar options={hourlyChartOptions} data={hourlyChartData} redraw />
            )}
          </div>
          {metrics.hourlyOrders.length > 0 && (
            <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
              {metrics.hourlyOrders.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/70 px-3 py-1.5">
                  <span className="font-medium text-gray-700">{entry.label}</span>
                  <span className="text-gray-500">
                    Rs. {entry.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-3xl border border-white/60 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.1)]">
          <h2 className="text-lg font-semibold text-brand-dark">Recent Orders</h2>
          <p className="text-xs text-gray-500">Latest customer activity.</p>
          <div className="space-y-2">
            {recentOrders.length === 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                No recent orders recorded.
              </div>
            )}
            {recentOrders.map((order) => (
              <article
                key={`${order.user}-${order.createdAt}`}
                className="rounded-2xl border border-gray-100 bg-white/80 px-3 py-3 shadow-sm"
              >
                <header className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-brand-dark">{order.user || 'Guest'}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </header>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">{order.items} item(s)</span>
                  <span className="font-semibold text-brand-dark">Rs. {order.total.toFixed(2)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Top Selling Items */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top Selling Items (30 days)</h2>
          <p className="text-sm text-gray-500 mt-1">Best performers ranked by revenue</p>
        </div>
        {metrics.topItems && metrics.topItems.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.topItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.orders} {item.orders === 1 ? 'order' : 'orders'}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <p className="text-base font-semibold text-gray-900">
                    Rs. {item.revenue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
            No data available
          </div>
        )}
      </div>

      {loading && <p className="text-xs text-gray-500">Updating metrics…</p>}
    </div>
  );
}

function StatCard({ title, value, highlight = false }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/95 px-5 py-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)] ${
        highlight ? 'bg-gradient-to-br from-[#eef2ff] via-white to-white border-[#c7d2fe]' : ''
      }`}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-brand-dark">{value}</p>
    </div>
  );
}


