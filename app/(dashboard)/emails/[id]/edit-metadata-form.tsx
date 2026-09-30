'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Email, Campaign } from '@/lib/types'

interface EditMetadataFormProps {
  email: Email & { campaign?: Campaign | null }
  campaigns: Campaign[]
  userId: string
}

export function EditMetadataForm({ email, campaigns, userId }: EditMetadataFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [formData, setFormData] = useState({
    company: email.company || '',
    contactName: email.contact_name || '',
    contactEmail: email.contact_email || '',
    campaignId: email.campaign_id || '',
    newCampaignName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      let campaignId = formData.campaignId

      if (showNewCampaign && formData.newCampaignName) {
        const { data: newCampaign, error: campaignError } = await supabase
          .from('campaigns')
          .insert({
            name: formData.newCampaignName,
            created_by: userId,
          })
          .select()
          .single()

        if (campaignError) throw campaignError
        campaignId = newCampaign.id
      }

      const { error } = await supabase
        .from('emails')
        .update({
          company: formData.company || null,
          contact_name: formData.contactName || null,
          contact_email: formData.contactEmail || null,
          campaign_id: campaignId || null,
        })
        .eq('id', email.id)

      if (error) throw error

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating metadata:', error)
      alert('Failed to update metadata. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isEditing) {
    const hasMetadata = email.company || email.contact_name || email.contact_email || email.campaign_id

    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Metadata (Optional)</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {hasMetadata ? 'Edit' : 'Add Metadata'}
          </button>
        </div>

        {hasMetadata ? (
          <dl className="grid grid-cols-2 gap-4">
            {email.company && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Company</dt>
                <dd className="mt-1 text-sm text-gray-900">{email.company}</dd>
              </div>
            )}
            {email.contact_name && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Contact Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{email.contact_name}</dd>
              </div>
            )}
            {email.contact_email && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Contact Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{email.contact_email}</dd>
              </div>
            )}
            {email.campaign && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Campaign</dt>
                <dd className="mt-1 text-sm text-gray-900">{email.campaign.name}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-gray-500">
            Add metadata like company, contact, and campaign for better organization and analytics.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Edit Metadata</h2>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
          Company
        </label>
        <input
          type="text"
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Optional"
        />
      </div>

      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
          Contact Name
        </label>
        <input
          type="text"
          id="contactName"
          value={formData.contactName}
          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Optional"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Contact Email
        </label>
        <input
          type="email"
          id="contactEmail"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Campaign
        </label>
        {!showNewCampaign ? (
          <div className="flex gap-2">
            <select
              value={formData.campaignId}
              onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCampaign(true)}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
            >
              New
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.newCampaignName}
              onChange={(e) => setFormData({ ...formData, newCampaignName: e.target.value })}
              placeholder="Campaign name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowNewCampaign(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => {
            setIsEditing(false)
            setFormData({
              company: email.company || '',
              contactName: email.contact_name || '',
              contactEmail: email.contact_email || '',
              campaignId: email.campaign_id || '',
              newCampaignName: '',
            })
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Metadata'}
        </button>
      </div>
    </form>
  )
}
