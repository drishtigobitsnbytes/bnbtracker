import { DashboardMetrics } from '@/lib/types'

interface MetricsGridProps {
  metrics: DashboardMetrics
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const stats = [
    { label: 'Total Emails Sent', value: metrics.total_sent },
    { label: 'Unique Emails Opened', value: metrics.unique_opened },
    { label: 'Emails Not Opened', value: metrics.not_opened },
    { label: 'Detected Open Rate', value: `${metrics.open_rate}%` },
    { label: 'Total Detected Opens', value: metrics.total_opens },
    { label: 'Active Campaigns', value: metrics.active_campaigns },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200"
        >
          <div className="px-6 py-5">
            <dt className="text-sm font-medium text-gray-600 truncate">
              {stat.label}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stat.value}
            </dd>
          </div>
        </div>
      ))}
    </div>
  )
}
