'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

type MetricsResponse = {
  orderMetrics: {
    totalSales: number;
    pending: number;
    inKitchen: number;
    inTransit: number;
    delivered: number;
    topItems: Array<{ title: string; revenue: number; orders: number }>;
  };
  sales: {
    daily: { labels: string[]; totals: number[] };
    weekly: { labels: string[]; totals: number[] };
  };
};

type AdminDashboardProps = {
  metrics: MetricsResponse | null;
  loading: boolean;
  onRefresh: () => void;
};

export default function AdminDashboard({ metrics, loading, onRefresh }: AdminDashboardProps) {
  const dailyChartData = useMemo(
    () => ({
      labels: metrics?.sales.daily.labels ?? [],
      datasets: [
        {
          label: 'Daily Revenue (NPR)',
          data: metrics?.sales.daily.totals ?? [],
          borderColor: '#f36a10',
          backgroundColor: 'rgba(243, 106, 16, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#f36a10',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    }),
    [metrics?.sales.daily]
  );

  const weeklyChartData = useMemo(
    () => ({
      labels: metrics?.sales.weekly.labels ?? [],
      datasets: [
        {
          label: 'Weekly Revenue (NPR)',
          data: metrics?.sales.weekly.totals ?? [],
          backgroundColor: '#7f1d1d',
          borderRadius: 6,
          barThickness: 32
        }
      ]
    }),
    [metrics?.sales.weekly]
  );

  const dailyChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' as const },
        tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 10,
          callbacks: {
            label: (context: any) => `Rs. ${Number(context.parsed.y).toFixed(2)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { callback: (v: any) => `Rs. ${v}` }
        }
      }
    }),
    []
  );

  const weeklyChartOptions = useMemo(() => dailyChartOptions, []);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white shadow-md overflow-hidden w-full">
      
      {/* Header */}
      <section className="bg-gradient-to-r from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] py-8 px-12 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-base text-white/80">
              Monitor revenue, orders, and daily performance.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* Content */}
      <div className="px-12 py-8 space-y-6">
        
        {/* Revenue + Orders */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          <div className="bg-gradient-to-r from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] rounded-xl p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80 mb-4">TOTAL REVENUE</p>
            <p className="text-5xl font-bold">Rs. {metrics?.orderMetrics.totalSales.toFixed(2) ?? '0.00'}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-4">ORDERS OVERVIEW</p>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                Pending {metrics?.orderMetrics.pending ?? 0}
              </span>
              <span className="px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                In Kitchen {metrics?.orderMetrics.inKitchen ?? 0}
              </span>
              <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                In Transit {metrics?.orderMetrics.inTransit ?? 0}
              </span>
              <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                Delivered {metrics?.orderMetrics.delivered ?? 0}
              </span>
            </div>
          </div>

        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Daily Sales</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">Trend</span>
            </div>
            <div className="h-80">
              {metrics?.sales.daily.labels.length ? (
                <Line data={dailyChartData} options={dailyChartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500 text-xs">
                  No data available
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Sales</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">Overview</span>
            </div>
            <div className="h-80">
              {metrics?.sales.weekly.labels.length ? (
                <Bar data={weeklyChartData} options={weeklyChartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500 text-xs">
                  No data available
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Top Selling Items */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Selling Items (30 days)</h2>
            <p className="text-sm text-gray-500 mt-1">Best performers ranked by revenue</p>
          </div>
          {metrics?.orderMetrics.topItems && metrics.orderMetrics.topItems.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {metrics.orderMetrics.topItems.map((item, index) => (
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
      </div>
    </div>
  );
}
