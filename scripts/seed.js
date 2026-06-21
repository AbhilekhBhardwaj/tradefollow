const fs = require('fs')
const path = require('path')

// Load .env.local so Supabase keys are available without dotenv
const envFile = path.resolve(__dirname, '..', '.env.local')
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach(line => {
      const m = line.match(/^([^#\s][^=]*)=(.+)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    })
}

const WALLETS = [
  '0x393d0b87ed38fc779fd9611144ae649ba6082109',
  '0x488d2a9b70cc18ef66057a48ab3d59da1c59fe08',
  '0x4eb8d907136189a34c9b087950211b6a566f7819',
  '0x05cafe987297448f21a3c7ae0ae815fddecac655',
  '0x90b38c5728f184c87ef46479cf7b402d7b98b98a',
  '0x85530f0ff6496c72a619f37a60f3c1a59077737f',
  '0x4e14fc11f58b64740e66e4b1aa188a4b007c0eab',
  '0x082e843a431aef031264dc232693dd710aedca88',
]

const HL_API = 'https://api.hyperliquid.xyz/info'

async function hlPost(body) {
  const res = await fetch(HL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function getFills(address) {
  const data = await hlPost({ type: 'userFills', user: address })
  return Array.isArray(data) ? data : []
}

async function getStats(address) {
  const fills = await getFills(address)
  const closedTrades = fills.filter(f => parseFloat(f.closedPnl ?? 0) !== 0)
  const totalPnl = fills.reduce((sum, f) => sum + parseFloat(f.closedPnl ?? 0), 0)
  const wins = closedTrades.filter(f => parseFloat(f.closedPnl) > 0).length
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0
  return {
    total_pnl: parseFloat(totalPnl.toFixed(4)),
    win_rate: parseFloat(winRate.toFixed(2)),
    trade_count: fills.length,
    fills,
  }
}

function toTradeRow(address, f) {
  return {
    trader_address: address,
    coin: f.coin,
    direction: f.dir ?? (f.side === 'B' ? 'Buy' : 'Sell'),
    price: parseFloat(f.px),
    size: parseFloat(f.sz),
    leverage: f.leverage?.value ?? null,
    trade_time: new Date(f.time).toISOString(),
    raw_data: f,
  }
}

async function seedWallet(supabase, address) {
  process.stdout.write(`\n[${address}]\n`)

  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    console.error(`  Skipped: invalid address (${address.length} chars, need 42)`)
    return
  }

  // Fetch from Hyperliquid
  let fills, stats
  try {
    const result = await getStats(address)
    fills = result.fills
    stats = { total_pnl: result.total_pnl, win_rate: result.win_rate, trade_count: result.trade_count }
    console.log(`  Hyperliquid: ${fills.length} fills | PnL $${stats.total_pnl} | Win rate ${stats.win_rate}%`)
  } catch (err) {
    console.error(`  Hyperliquid error: ${err.message}`)
    return
  }

  // Upsert trader row (update stats if wallet already exists)
  const { error: traderErr } = await supabase
    .from('traders')
    .upsert({ wallet_address: address, ...stats }, { onConflict: 'wallet_address' })

  if (traderErr) {
    console.error(`  traders upsert failed: ${traderErr.message}`)
    return
  }
  console.log(`  traders row: saved`)

  if (fills.length === 0) return

  // Insert trades in batches of 500
  const rows = fills.map(f => toTradeRow(address, f))
  let saved = 0

  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error: batchErr } = await supabase.from('trades').insert(batch)
    if (batchErr) {
      console.error(`  trades batch ${Math.floor(i / 500) + 1} failed: ${batchErr.message}`)
    } else {
      saved += batch.length
    }
  }
  console.log(`  trades: ${saved}/${rows.length} inserted`)
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
    process.exit(1)
  }

  // Dynamic import handles the ESM build of @supabase/supabase-js
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key)

  console.log('TradeFollow seed script')
  console.log(`Seeding ${WALLETS.length} wallets from Hyperliquid...\n`)

  for (const wallet of WALLETS) {
    await seedWallet(supabase, wallet)
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error('\nSeed failed:', err.message)
  process.exit(1)
})
