import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { EmailWithDetails } from '@/lib/types'
import { calculateOpenRate, formatTime } from '@/lib/utils'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (!campaign) {
    notFound()
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin'

  if (campaign.created_by !== user.id && !isAdmin) {
    notFound()
  }

  const emailsQuery = supabase
    .from('emails')
    .select(
      `
      *,
      campaign:campaigns(*),
      owner:users(*)
    `
    )
    .eq('campaign_id', id)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })

  if (!isAdmin) {
    emailsQuery.eq('owner_id', user.id)
  }

  const { data: emails } = await emailsQuery

  const totalSent = emails?.length || 0
  const uniqueOpened = emails?.filter((e) => e.open_count > 0).length || 0
  const notOpened = totalSent - uniqueOpened
  const openRate = calculateOpenRate(totalSent, uniqueOpened)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {campaign.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <dt className="text-sm font-medium text-gray-600">Sent</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {totalSent}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <dt className="text-sm font-medium text-gray-600">Opened</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {uniqueOpened}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <dt className="text-sm font-medium text-gray-600">Not Opened</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {notOpened}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5">
            <dt className="text-sm font-medium text-gray-600">
              Detected Open Rate
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {openRate}%
            </dd>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Tracked Emails</h2>
        </div>
        {!emails || emails.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No sent emails in this campaign yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected Opens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Open
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Open
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emails.map((email: EmailWithDetails) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/emails/${email.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {email.company || 'Untitled'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {email.contact_name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {email.owner.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {email.open_count > 0 ? (
                        <span className="text-sm text-green-600">Opened</span>
                      ) : (
                        <span className="text-sm text-gray-500">Not opened</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {email.open_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(email.first_open_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(email.last_open_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
