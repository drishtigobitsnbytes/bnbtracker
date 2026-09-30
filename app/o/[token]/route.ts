import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createServiceClient()

  try {
    const { data: email } = await supabase
      .from('emails')
      .select('id')
      .eq('tracking_token', token)
      .single()

    if (email) {
      const userAgent = request.headers.get('user-agent') || null
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
      const ipHash = ip !== 'unknown' ? hashIP(ip) : null

      await supabase.from('email_events').insert({
        email_id: email.id,
        event_type: 'open',
        user_agent: userAgent,
        ip_hash: ipHash,
      })
    }
  } catch (error) {
    console.error('Tracking error:', error)
  }

  return new NextResponse(TRANSPARENT_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
