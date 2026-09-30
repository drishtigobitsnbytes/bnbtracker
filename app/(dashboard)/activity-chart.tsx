'use client'

import { useMemo } from 'react'

interface ActivityChartProps {
  data: { sent_at: string; open_count: number }[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const chartData = useMemo(() => {
    const dailyStats = new Map<string, { sent: number; opened: number }>()

    data.forEach((email) => {
      if (!email.sent_at) return
      const date = new Date(email.sent_at).toLocaleDateString()
      const stats = dailyStats.get(date) || { sent: 0, opened: 0 }
      stats.sent += 1
      if (email.open_count > 0) stats.opened += 1
      dailyStats.set(date, stats)
    })

    const sorted = Array.from(dailyStats.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-14)

    const maxValue = Math.max(
      ...sorted.map((d) => Math.max(d[1].sent, d[1].opened))
    )

    return sorted.map(([date, stats]) => ({
      date: new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      sent: stats.sent,
      opened: stats.opened,
      sentHeight: (stats.sent / maxValue) * 100,
      openedHeight: (stats.opened / maxValue) * 100,
    }))
  }, [data])

  if (chartData.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        Activity Trend (Last 14 Days)
      </h2>
      <div className="flex items-end justify-between h-64 gap-2">
        {chartData.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center gap-1 h-52">
              <div className="relative flex-1 flex flex-col justify-end">
                <div
                  className="bg-blue-500 rounded-t transition-all"
                  style={{ height: `${day.sentHeight}%` }}
                  title={`Sent: ${day.sent}`}
                />
              </div>
              <div className="relative flex-1 flex flex-col justify-end">
                <div
                  className="bg-green-500 rounded-t transition-all"
                  style={{ height: `${day.openedHeight}%` }}
                  title={`Opened: ${day.opened}`}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">{day.date}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-sm text-gray-600">Sent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-sm text-gray-600">Detected Opens</span>
        </div>
      </div>
    </div>
  )
}
