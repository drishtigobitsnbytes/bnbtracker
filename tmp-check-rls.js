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
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = env.SUPABASE_SERVICE_ROLE_KEY
const emailId = '94e6304f-2f40-4dfc-86f5-43eb6b053e22'

async function tryInsert(label, key) {
  const res = await fetch(`${url}/rest/v1/email_events`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      email_id: emailId,
      event_type: 'open',
      user_agent: 'anon-rls-probe',
    }),
  })
  const text = await res.text()
  console.log(label, res.status, text.slice(0, 500))
}

async function main() {
  await tryInsert('anon_insert', anon)
  const lookup = await fetch(
    `${url}/rest/v1/emails?id=eq.${emailId}&select=id,open_count,last_open_at`,
    { headers: { apikey: anon, Authorization: 'Bearer ' + anon } }
  )
  console.log('anon_lookup', lookup.status, await lookup.text())
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
