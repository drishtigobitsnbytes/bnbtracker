export type UserRole = 'admin' | 'member'

export type EmailStatus = 'draft' | 'sent'

export type EventType = 'open'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Email {
  id: string
  tracking_token: string
  owner_id: string
  campaign_id: string | null
  company: string | null
  contact_name: string | null
  contact_email: string | null
  status: EmailStatus
  sent_at: string | null
  first_open_at: string | null
  last_open_at: string | null
  open_count: number
  created_at: string
  updated_at: string
}

export interface EmailEvent {
  id: string
  email_id: string
  event_type: EventType
  user_agent: string | null
  ip_hash: string | null
  created_at: string
}

export interface EmailWithDetails extends Email {
  campaign: Campaign
  owner: User
}

export interface DashboardMetrics {
  total_sent: number
  unique_opened: number
  not_opened: number
  open_rate: number
  total_opens: number
  active_campaigns: number
}

export interface CampaignMetrics extends Campaign {
  total_sent: number
  unique_opened: number
  not_opened: number
  open_rate: number
}

export interface TeamMemberMetrics {
  user: User
  total_sent: number
  unique_opened: number
  open_rate: number
}

export interface RecentActivity {
  email: EmailWithDetails
  latest_event: string
}
