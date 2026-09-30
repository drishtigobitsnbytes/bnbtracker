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

async function probe(path) {
  const res = await fetch(url + path, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: 'select 1' }),
  })
  const text = await res.text()
  console.log(path, res.status, text.slice(0, 200))
}

async function main() {
  await probe('/pg/query')
  await probe('/pg-meta/query')
}

main().catch((e) => console.error(e.message))
