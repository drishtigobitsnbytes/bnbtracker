import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TeamMemberMetrics } from '@/lib/types'
import { calculateOpenRate } from '@/lib/utils'

async function getTeamMetrics() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('email')

  if (!users) return []

  const teamMetrics: TeamMemberMetrics[] = await Promise.all(
    users.map(async (user) => {
      const { data: emails } = await supabase
        .from('emails')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'sent')

      const totalSent = emails?.length || 0
      const uniqueOpened = emails?.filter((e) => e.open_count > 0).length || 0
      const openRate = calculateOpenRate(totalSent, uniqueOpened)

      return {
        user,
        total_sent: totalSent,
        unique_opened: uniqueOpened,
        open_rate: openRate,
      }
    })
  )

  return teamMetrics.filter((m) => m.total_sent > 0)
}

export default async function TeamPage() {
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

  if (userData?.role !== 'admin') {
    notFound()
  }

  const teamMetrics = await getTeamMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Team Overview</h1>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {teamMetrics.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No team activity yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opened
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected Open Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMetrics.map((member) => (
                  <tr key={member.user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.user.full_name || member.user.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.total_sent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.unique_opened}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.open_rate}%
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
