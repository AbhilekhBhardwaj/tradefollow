'use client'

import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchUserStats } from '@/lib/hyperliquid'

function shortenAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function Header() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) return

    async function syncWallet() {
      setSyncing(true)

      // 1. Upsert wallet — no-op if already exists
      const { error: upsertError } = await supabase
        .from('traders')
        .upsert({ wallet_address: address }, { onConflict: 'wallet_address', ignoreDuplicates: true })

      if (upsertError) {
        console.error('Failed to save wallet:', upsertError.message)
        setSyncing(false)
        return
      }

      // 2. Skip Hyperliquid sync if we already have data for this wallet
      const { data: existing } = await supabase
        .from('traders')
        .select('trade_count')
        .eq('wallet_address', address)
        .single()

      if (existing?.trade_count > 0) {
        setSyncing(false)
        return
      }

      // 3. Fetch stats + fills from Hyperliquid
      let fills, stats
      try {
        const result = await fetchUserStats(address)
        fills = result.fills
        stats = { total_pnl: result.total_pnl, win_rate: result.win_rate, trade_count: result.trade_count }
      } catch (err) {
        console.error('Hyperliquid fetch failed:', err.message)
        setSyncing(false)
        return
      }

      // 4. Update trader stats row
      const { error: updateError } = await supabase
        .from('traders')
        .update(stats)
        .eq('wallet_address', address)

      if (updateError) console.error('Failed to update trader stats:', updateError.message)

      // 5. Insert fills into trades table in batches of 500
      if (fills.length > 0) {
        const rows = fills.map(f => ({
          trader_address: address,
          coin: f.coin,
          direction: f.dir ?? (f.side === 'B' ? 'Buy' : 'Sell'),
          price: parseFloat(f.px),
          size: parseFloat(f.sz),
          leverage: f.leverage?.value ?? null,
          trade_time: new Date(f.time).toISOString(),
          raw_data: f,
        }))

        for (let i = 0; i < rows.length; i += 500) {
          const { error: tradesError } = await supabase
            .from('trades')
            .insert(rows.slice(i, i + 500))
          if (tradesError) console.error('Failed to insert trades batch:', tradesError.message)
        }
      }

      setSyncing(false)
    }

    syncWallet()
  }, [isConnected, address])

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#080a0d]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 text-white"
              >
                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Trade<span className="text-cyan-400">Follow</span>
            </span>
          </div>

          {/* Wallet button */}
          {isConnected ? (
            <button
              onClick={openAccountModal}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-sm font-medium text-emerald-400 transition-all hover:border-emerald-400/60 hover:bg-emerald-500/20 active:scale-95"
            >
              {syncing ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  <span className="text-amber-400">Syncing…</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {shortenAddress(address)}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => openConnectModal?.()}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/20 active:scale-95"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
