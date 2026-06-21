export function shortenAddress(address) {
  if (!address) return '—'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatPnl(value) {
  if (value == null) return '—'
  const abs = Math.abs(value)
  const formatted =
    abs >= 1_000_000
      ? `$${(abs / 1_000_000).toFixed(2)}M`
      : abs >= 1_000
      ? `$${(abs / 1_000).toFixed(1)}K`
      : `$${abs.toFixed(2)}`
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

export function pnlClass(value) {
  if (value == null) return 'text-zinc-500'
  return value >= 0 ? 'text-emerald-400' : 'text-red-400'
}

export function winRateClass(value) {
  if (value == null) return 'text-zinc-500'
  if (value >= 60) return 'text-emerald-400'
  if (value >= 50) return 'text-amber-400'
  return 'text-red-400'
}

export function parseDirection(dir) {
  if (!dir) return null
  const d = dir.toLowerCase()
  if (d.includes('long') || d === 'buy') return 'Long'
  if (d.includes('short') || d === 'sell') return 'Short'
  return null
}

export function formatPrice(value) {
  if (value == null) return '—'
  return value >= 1000
    ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : `$${value.toFixed(4)}`
}

export function formatTradeTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
