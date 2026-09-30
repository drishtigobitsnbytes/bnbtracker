import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateTrackerForm } from './create-tracker-form'

export default async function NewTrackerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Generate Email Tracker
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Generate a unique tracking identifier instantly. Add metadata later for organization and analytics.
        </p>
      </div>
      <CreateTrackerForm />
    </div>
  )
}
