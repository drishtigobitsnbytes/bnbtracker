import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardMetrics, EmailWithDetails, RecentActivity } from '@/lib/types'
import { calculateOpenRate, formatRelativeTime } from '@/lib/utils'
import { MetricsGrid } from './metrics-grid'
import { ActivityChart } from './activity-chart'

async function getDashboardData(userId: string, isAdmin: boolean) {
  const supabase = await createClient()

  const emailsQuery = supabase
    .from('emails')
    .select(`
      *,
      campaign:campaigns(*),
      owner:users(*)
    `)
    .eq('status', 'sent')

  if (!isAdmin) {
    emailsQuery.eq('owner_id', userId)
  }

  const { data: emails } = await emailsQuery

  const totalSent = emails?.length || 0
  const uniqueOpened = emails?.filter((e) => e.open_count > 0).length || 0
  const notOpened = totalSent - uniqueOpened
  const totalOpens = emails?.reduce((sum, e) => sum + e.open_count, 0) || 0
  const openRate = calculateOpenRate(totalSent, uniqueOpened)

  const { count: activeCampaigns } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })

  const metrics: DashboardMetrics = {
    total_sent: totalSent,
    unique_opened: uniqueOpened,
    not_opened: notOpened,
    open_rate: openRate,
    total_opens: totalOpens,
    active_campaigns: activeCampaigns || 0,
  }

  const recentActivityQuery = supabase
    .from('emails')
    .select(`
      *,
      campaign:campaigns(*),
      owner:users(*),
      events:email_events(*)
    `)
    .eq('status', 'sent')
    .order('updated_at', { ascending: false })
    .limit(10)

  if (!isAdmin) {
    recentActivityQuery.eq('owner_id', userId)
  }

  const { data: recentEmails } = await recentActivityQuery

  const recentActivity: RecentActivity[] =
    recentEmails?.map((email) => ({
      email: email as EmailWithDetails,
      latest_event:
        email.last_open_at || email.sent_at || email.created_at,
    })) || []

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const chartQuery = supabase
    .from('emails')
    .select('sent_at, open_count')
    .eq('status', 'sent')
    .gte('sent_at', thirtyDaysAgo.toISOString())

  if (!isAdmin) {
    chartQuery.eq('owner_id', userId)
  }

  const { data: chartData } = await chartQuery

  return { metrics, recentActivity, chartData: chartData || [] }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin'

  if (!isAdmin) {
    redirect('/my-emails')
  }

  const { metrics, recentActivity, chartData } = await getDashboardData(
    user.id,
    isAdmin
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Dashboard
          </h1>
        </div>
        <Link
          href="/emails/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Tracker
        </Link>
      </div>

      <MetricsGrid metrics={metrics} />

      {chartData.length > 0 && <ActivityChart data={chartData} />}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No tracking activity yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentActivity.map(({ email, latest_event }) => (
              <Link
                key={email.id}
                href={`/emails/${email.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {email.company || 'Untitled'}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {email.contact_name || 'No contact'}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    <p className="text-sm text-gray-900">
                      {email.open_count > 0 ? (
                        <span className="text-green-600">Opened</span>
                      ) : (
                        <span className="text-gray-500">Not opened</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(latest_event)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
