import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CampaignMetrics } from '@/lib/types'
import { calculateOpenRate } from '@/lib/utils'

async function getCampaigns(userId: string, isAdmin: boolean) {
  const supabase = await createClient()

  const campaignsQuery = supabase.from('campaigns').select('*').order('name')

  if (!isAdmin) {
    campaignsQuery.eq('created_by', userId)
  }

  const { data: campaigns } = await campaignsQuery

  if (!campaigns) return []

  const campaignsWithMetrics: CampaignMetrics[] = await Promise.all(
    campaigns.map(async (campaign) => {
      const emailsQuery = supabase
        .from('emails')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('status', 'sent')

      if (!isAdmin) {
        emailsQuery.eq('owner_id', userId)
      }

      const { data: emails } = await emailsQuery

      const totalSent = emails?.length || 0
      const uniqueOpened = emails?.filter((e) => e.open_count > 0).length || 0
      const notOpened = totalSent - uniqueOpened
      const openRate = calculateOpenRate(totalSent, uniqueOpened)

      return {
        ...campaign,
        total_sent: totalSent,
        unique_opened: uniqueOpened,
        not_opened: notOpened,
        open_rate: openRate,
      }
    })
  )

  return campaignsWithMetrics
}

export default async function CampaignsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin'
  const campaigns = await getCampaigns(user.id, isAdmin)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">
            No campaigns yet. Create a tracker to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {campaign.name}
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Sent</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {campaign.total_sent}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Opened</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {campaign.unique_opened}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Not Opened</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {campaign.not_opened}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Detected Open Rate</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {campaign.open_rate}%
                  </dd>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
