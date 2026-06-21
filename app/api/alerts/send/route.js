import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendTelegramMessage } from '@/lib/telegram'
import { shortenAddress } from '@/lib/format'

function buildAlertMessage(trader_address, { coin, direction, price, size, leverage }) {
  const isLong =
    direction?.toLowerCase().includes('long') || direction?.toLowerCase() === 'buy'
  const dir = isLong ? 'LONG' : 'SHORT'
  const emoji = isLong ? '📈' : '📉'

  const fmt = (n, prefix = '$') =>
    n != null
      ? `${prefix}${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
      : '—'

  return [
    `🚨 <b>TradeFollow Alert</b>`,
    `Trader ${shortenAddress(trader_address)} just made a move!`,
    ``,
    `${emoji} <b>${dir} ${coin ?? '—'} @ ${fmt(price)}</b>`,
    `Size: ${fmt(size)} | Leverage: ${leverage != null ? `${leverage}x` : '—'}`,
    ``,
    `Act fast — open your Hyperliquid app now!`,
  ].join('\n')
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { trader_address, coin, direction, price, size, leverage } = body

  if (!trader_address) {
    return NextResponse.json({ error: 'trader_address is required' }, { status: 400 })
  }

  // Fetch all followers with a confirmed chat_id
  const { data: followers, error: fetchErr } = await supabase
    .from('followers')
    .select('telegram_chat_id')
    .eq('trader_address', trader_address)
    .not('telegram_chat_id', 'is', null)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!followers || followers.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, total: 0 })
  }

  const message = buildAlertMessage(trader_address, { coin, direction, price, size, leverage })

  const results = await Promise.allSettled(
    followers.map(f => sendTelegramMessage(f.telegram_chat_id, message))
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed, total: followers.length })
}
