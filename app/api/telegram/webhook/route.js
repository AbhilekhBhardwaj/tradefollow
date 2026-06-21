import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendTelegramMessage } from '@/lib/telegram'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = body?.message
  if (!message) return NextResponse.json({ ok: true })

  const text = message.text?.trim() ?? ''
  const chatId = message.chat?.id
  const username = message.from?.username

  if (!chatId) return NextResponse.json({ ok: true })

  if (text === '/start' || text.startsWith('/start ')) {
    if (!username) {
      await sendTelegramMessage(
        chatId,
        '⚠️ <b>No Telegram username found.</b>\n\nPlease set a username in Telegram Settings, then try again.'
      )
      return NextResponse.json({ ok: true })
    }

    // Update all follower rows that match this username — saves their chat_id
    const { data: updated, error } = await supabase
      .from('followers')
      .update({ telegram_chat_id: String(chatId) })
      .eq('telegram_username', username)
      .select('id')

    if (error) {
      console.error('Webhook DB error:', error.message)
      return NextResponse.json({ ok: true })
    }

    if (updated && updated.length > 0) {
      await sendTelegramMessage(
        chatId,
        `✅ <b>You're all set, @${username}!</b>\n\nYou'll receive real-time alerts every time a trader you follow on TradeFollow makes a move.\n\n📊 Head to TradeFollow to follow more traders.`
      )
    } else {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>No subscription found for @${username}.</b>\n\nMake sure you clicked <b>Follow This Trader</b> on TradeFollow and entered your exact Telegram username.`
      )
    }
  }

  return NextResponse.json({ ok: true })
}
