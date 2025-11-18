'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useMemo } from 'react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type AdminOrderInsightsProps = {
  hourlyLabels: string[];
  hourlySales: number[];
  hourlyTotals: number[];
  topItems: Array<{ title: string; revenue: number }>;
};

export default function AdminOrderInsights({ hourlyLabels, hourlySales, hourlyTotals, topItems }: AdminOrderInsightsProps) {
  const chartData = useMemo(
    () => ({
      labels: hourlyLabels,
      datasets: [
        {
          label: 'Total Sales',
          data: hourlyTotals,
          borderColor: '#1f2937',
          backgroundColor: 'rgba(17, 24, 39, 0.2)',
          tension: 0.4,
          fill: true,
          pointRadius: 0
        },
        {
          label: 'Hourly Sales',
          data: hourlySales,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.25)',
          tension: 0.4,
          fill: true,
          pointRadius: 0
        }
      ]
    }),
    [hourlyLabels, hourlySales, hourlyTotals]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          borderWidth: 0
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#6b7280'
          },
          grid: {
            display: false
          }
        },
        y: {
          ticks: {
            color: '#6b7280',
            callback: (value: string | number) => `Rs. ${Number(value).toFixed(0)}`
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.15)'
          }
        }
      }
    }),
    []
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Sales Figure</p>
            <h2 className="text-lg font-semibold text-brand-dark">Today</h2>
          </div>
        </div>
        <div className="mt-6 h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">Top Selling Items</h2>
        <ul className="space-y-3">
          {topItems.slice(0, 8).map((item, index) => (
            <li key={item.title} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {index + 1}. {item.title}
                </p>
              </div>
              <span className="text-sm font-semibold text-brand-dark">Rs. {item.revenue.toFixed(2)}</span>
            </li>
          ))}
          {topItems.length === 0 && <li className="text-sm text-gray-500">No sales yet today.</li>}
        </ul>
      </section>
    </div>
  );
}

