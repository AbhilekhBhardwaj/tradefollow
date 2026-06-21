const HL_API = 'https://api.hyperliquid.xyz/info'

async function post(body) {
  const res = await fetch(HL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Hyperliquid API error: ${res.status}`)
  return res.json()
}

export async function fetchUserFills(address) {
  const data = await post({ type: 'userFills', user: address })
  return Array.isArray(data) ? data : []
}

export async function fetchOpenPositions(address) {
  const data = await post({ type: 'clearinghouseState', user: address })
  return data?.assetPositions ?? []
}

export async function fetchUserStats(address) {
  const fills = await fetchUserFills(address)

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
