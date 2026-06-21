import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from '@/app/components/Header'
import FollowModal from './FollowModal'
import {
  shortenAddress,
  formatPnl,
  pnlClass,
  winRateClass,
  parseDirection,
  formatPrice,
  formatTradeTime,
} from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function TraderPage({ params }) {
  const { address } = await params

  const [{ data: trader }, { data: trades }, { data: follows }] = await Promise.all([
    supabase.from('traders').select('*').eq('wallet_address', address).single(),
    supabase
      .from('trades')
      .select('*')
      .eq('trader_address', address)
      .order('trade_time', { ascending: false })
      .limit(50),
    supabase.from('followers').select('id').eq('trader_address', address),
  ])

  if (!trader) notFound()

  const followerCount = follows?.length ?? 0

  return (
    <div className="min-h-screen bg-[#080a0d] text-zinc-100">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Back link ── */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
          </svg>
          Leaderboard
        </Link>

        {/* ── Trader header ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-2xl font-bold text-white">
              {shortenAddress(trader.wallet_address)}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-600 break-all">
              {trader.wallet_address}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
            </p>
          </div>
          <FollowModal traderAddress={address} />
        </div>

        {/* ── Stats cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Total PnL</p>
            <p className={`mt-1.5 text-xl font-bold ${pnlClass(trader.total_pnl)}`}>
              {formatPnl(trader.total_pnl)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">PnL %</p>
            <p className={`mt-1.5 text-xl font-bold ${pnlClass(trader.total_pnl)}`}>
              {trader.total_pnl != null
                ? `${trader.total_pnl >= 0 ? '+' : ''}${trader.total_pnl.toFixed(2)}%`
                : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Win Rate</p>
            <p className={`mt-1.5 text-xl font-bold ${winRateClass(trader.win_rate)}`}>
              {trader.win_rate != null ? `${trader.win_rate.toFixed(1)}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Trades</p>
            <p className="mt-1.5 text-xl font-bold text-white">
              {(trader.trade_count ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Followers</p>
            <p className="mt-1.5 text-xl font-bold text-white">{followerCount}</p>
          </div>
        </div>

        {/* ── Recent trades ── */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Trades</h2>

          {trades && trades.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.03]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-left">
                      {['Time', 'Coin', 'Direction', 'Price', 'Size'].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-zinc-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {trades.map((trade) => {
                      const dir = parseDirection(trade.direction)
                      return (
                        <tr key={trade.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 tabular-nums text-zinc-400">
                            {formatTradeTime(trade.trade_time)}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-zinc-100">
                            {trade.coin ?? '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            {dir ? (
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                                  dir === 'Long'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {dir}
                              </span>
                            ) : (
                              <span className="text-zinc-500">{trade.direction ?? '—'}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 tabular-nums text-zinc-300">
                            {formatPrice(trade.price)}
                          </td>
                          <td className="px-5 py-3.5 tabular-nums text-zinc-300">
                            {trade.size != null ? trade.size.toFixed(4) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] py-16 text-sm text-zinc-600">
              No trades found for this wallet.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
