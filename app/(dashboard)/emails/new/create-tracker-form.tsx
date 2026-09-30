'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateTrackingToken } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function CreateTrackerForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  const handleGenerate = async () => {
    if (!userId) {
      setError('User not authenticated')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const trackingToken = generateTrackingToken()

      const { data: email, error: emailError } = await supabase
        .from('emails')
        .insert({
          tracking_token: trackingToken,
          owner_id: userId,
          status: 'draft',
        })
        .select()
        .single()

      if (emailError) {
        throw new Error(emailError.message || 'Failed to create tracker')
      }

      if (!email) {
        throw new Error('No data returned from insert')
      }

      router.push(`/emails/${email.id}`)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create tracker. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!userId) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <button
            onClick={handleGenerate}
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Generating...' : 'Generate Tracker'}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Click to instantly generate a unique tracking identifier
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Check the browser console for more details
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Generate a tracker instantly, copy the tracking image, and insert it into your email. You can add metadata like company, contact name, and campaign later for analytics.
        </p>
      </div>
    </div>
  )
}
