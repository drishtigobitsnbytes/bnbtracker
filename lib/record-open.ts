import { createClient } from '@supabase/supabase-js'

async function hashIP(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function restHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

// Use direct dot-notation so Next.js inlines these at build time.
// process.env[dynamicName] does NOT get inlined and is undefined on Cloudflare Pages.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function recordEmailOpen(request: Request, token: string) {
  if (!SUPABASE_URL) {
    console.error('[Tracking] Missing NEXT_PUBLIC_SUPABASE_URL. Value:', typeof SUPABASE_URL)
    return
  }

  const userAgent = request.headers.get('user-agent')
  const forwarded =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0]!.trim() : null
  const ipHash = ip ? await hashIP(ip) : null

  // ── Path 1: RPC function (works with anon key, no service key needed) ──
  if (ANON_KEY) {
    try {
      const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_email_open`, {
        method: 'POST',
        headers: restHeaders(ANON_KEY),
        body: JSON.stringify({
          p_token: token,
          p_user_agent: userAgent,
          p_ip_hash: ipHash,
        }),
      })

      if (rpcResponse.ok) {
        console.log('[Tracking] Open recorded via RPC')
        return
      }

      const rpcBody = await rpcResponse.text()
      console.error('[Tracking] RPC failed:', rpcResponse.status, rpcBody)
      // Fall through to service-key path
    } catch (err) {
      console.error('[Tracking] RPC fetch error:', err)
      // Fall through to service-key path
    }
  }

  // ── Path 2: Direct DB access with service role key ──
  if (!SERVICE_KEY) {
    console.error(
      '[Tracking] Missing SUPABASE_SERVICE_ROLE_KEY at runtime.',
      'ANON_KEY available:', !!ANON_KEY,
      'SUPABASE_URL available:', !!SUPABASE_URL
    )
    return
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data: email, error: lookupError } = await supabase
    .from('emails')
    .select('id, open_count, first_open_at')
    .eq('tracking_token', token)
    .maybeSingle()

  if (lookupError) {
    console.error('[Tracking] Email lookup error:', lookupError)
    return
  }

  if (!email) {
    console.warn('[Tracking] No email found for token:', token.slice(0, 8) + '...')
    return
  }

  const { error: insertError } = await supabase.from('email_events').insert({
    email_id: email.id,
    event_type: 'open',
    user_agent: userAgent,
    ip_hash: ipHash,
  })

  if (insertError) {
    console.error('[Tracking] Event insert error:', insertError)
    return
  }

  // Bump open count directly (the DB trigger also does this,
  // but we update explicitly in case the trigger is missing)
  const openedAt = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('emails')
    .update({
      open_count: (email.open_count || 0) + 1,
      first_open_at: email.first_open_at || openedAt,
      last_open_at: openedAt,
    })
    .eq('id', email.id)

  if (updateError) {
    console.error('[Tracking] Open count update error:', updateError)
  }

  console.log('[Tracking] Event recorded for email:', email.id)
}
