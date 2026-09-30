'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MarkAsSentButtonProps {
  emailId: string
}

export function MarkAsSentButton({ emailId }: MarkAsSentButtonProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMarkAsSent = async () => {
    if (!confirm('Mark this email as sent?')) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('emails')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', emailId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error marking as sent:', error)
      alert('Failed to mark as sent. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <button
      onClick={handleMarkAsSent}
      disabled={isSubmitting}
      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
    >
      {isSubmitting ? 'Updating...' : 'Mark as Sent'}
    </button>
  )
}
