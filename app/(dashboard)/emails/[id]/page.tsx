import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'
import { MarkAsSentButton } from './mark-as-sent-button'
import { CopyButton } from './copy-button'
import { EditMetadataForm } from './edit-metadata-form'

export default async function EmailDetailPage({
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

  const { data: email } = await supabase
    .from('emails')
    .select(
      `
      *,
      campaign:campaigns(*),
      owner:users(*)
    `
    )
    .eq('id', id)
    .single()

  if (!email) {
    notFound()
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (email.owner_id !== user.id && userData?.role !== 'admin') {
    notFound()
  }

  const { data: events } = await supabase
    .from('email_events')
    .select('*')
    .eq('email_id', email.id)
    .order('created_at', { ascending: false })

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('name')

  const trackingUrl = `${process.env.NEXT_PUBLIC_TRACKING_BASE_URL}/o/${email.tracking_token}`
  const trackingImage = `<img src="${trackingUrl}" width="1" height="1" alt="" />`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Tracker Details</h1>
        {email.status === 'draft' && email.owner_id === user.id && (
          <MarkAsSentButton emailId={email.id} />
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Tracking Code</h2>
        <p className="text-sm text-gray-600">
          Copy this tracking image and paste it into your email before sending.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Tracking Image (Copy this)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={trackingImage}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <CopyButton text={trackingImage} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Tracking URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={trackingUrl}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <CopyButton text={trackingUrl} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-medium text-gray-900">Tracking Statistics</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-600">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  email.status === 'sent'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {email.status === 'sent' ? 'Sent' : 'Not Sent'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDate(email.created_at)}
            </dd>
          </div>
          {email.sent_at && (
            <div>
              <dt className="text-sm font-medium text-gray-600">Sent</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(email.sent_at)}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-600">
              Detected Opens
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{email.open_count}</dd>
          </div>
          {email.first_open_at && (
            <div>
              <dt className="text-sm font-medium text-gray-600">
                First Detected Open
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(email.first_open_at)}
              </dd>
            </div>
          )}
          {email.last_open_at && (
            <div>
              <dt className="text-sm font-medium text-gray-600">
                Last Detected Open
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(email.last_open_at)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <EditMetadataForm email={email} campaigns={campaigns || []} userId={user.id} />

      {events && events.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Event Timeline
          </h2>
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 text-sm border-l-2 border-green-500 pl-3 py-1"
              >
                <span className="text-gray-900">Open detected</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-600">
                  {formatTime(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
