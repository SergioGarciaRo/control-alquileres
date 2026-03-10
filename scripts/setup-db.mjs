const TOKEN = process.env.VERCEL_PERSONAL_TOKEN
const TEAM = process.env.VERCEL_TEAM_ID
const PROJECT_ID = process.env.VERCEL_PROJECT_ID

// Try to create Neon Postgres via Vercel's marketplace
async function tryVercelPostgres() {
  // Try the new Vercel Postgres API
  const endpoints = [
    { method: 'POST', url: `https://api.vercel.com/v2/storage/postgres?teamId=${TEAM}`, body: { name: 'rental-manager-db', region: 'iad1', projectIds: [PROJECT_ID] } },
    { method: 'POST', url: `https://api.vercel.com/v1/storage/postgres?teamId=${TEAM}`, body: { name: 'rental-manager-db', region: 'iad1' } },
  ]

  for (const ep of endpoints) {
    const r = await fetch(ep.url, {
      method: ep.method,
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(ep.body)
    })
    const d = await r.json()
    console.log(`${ep.method} ${ep.url} -> ${r.status}`)
    if (r.status < 300) {
      console.log('SUCCESS:', JSON.stringify(d).substring(0, 500))
      return d
    }
    console.log('Error:', JSON.stringify(d).substring(0, 200))
  }
  return null
}

// Create Neon DB directly via their API
async function tryNeonDirect() {
  // Neon allows creating projects via their API with just an API key
  // Let's check if we can get a Neon key from Vercel
  const r = await fetch(`https://api.vercel.com/v1/integrations/git/repo?teamId=${TEAM}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  })
  const d = await r.json()
  console.log('Git repo check:', r.status, JSON.stringify(d).substring(0, 200))
}

// Check what Vercel storage options are available
async function checkStorageAPI() {
  const endpoints = [
    `https://api.vercel.com/v1/storage?teamId=${TEAM}`,
    `https://api.vercel.com/v2/storage?teamId=${TEAM}`,
    `https://api.vercel.com/v1/storage/stores?teamId=${TEAM}`,
  ]

  for (const url of endpoints) {
    const r = await fetch(url, { headers: { 'Authorization': `Bearer ${TOKEN}` } })
    const d = await r.json()
    console.log(`GET ${url} -> ${r.status}`, JSON.stringify(d).substring(0, 300))
  }
}

await checkStorageAPI()
await tryVercelPostgres()
