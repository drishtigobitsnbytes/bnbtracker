const fs = require('fs')
const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, ''),
      ]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
const token =
  '4a8ef9caa9fc5544f4b8eca7243a8d0aa06022c517456f67a75e86b1b507aa8e'

async function main() {
  const headers = { apikey: key, Authorization: 'Bearer ' + key }
  const er = await fetch(
    `${url}/rest/v1/emails?tracking_token=eq.${token}&select=id,status,open_count,first_open_at,last_open_at,sent_at`,
    { headers }
  )
  const emails = await er.json()
  console.log('lookup_status', er.status)
  console.log(JSON.stringify(emails, null, 2))
  if (Array.isArray(emails) && emails[0]) {
    const ev = await fetch(
      `${url}/rest/v1/email_events?email_id=eq.${emails[0].id}&select=id,event_type,created_at&order=created_at.desc&limit=10`,
      { headers }
    )
    console.log('events_status', ev.status)
    console.log(JSON.stringify(await ev.json(), null, 2))
  }
}

main().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
