'use client'

import { useRouter } from 'next/navigation'
import { shortenAddress, formatPnl, pnlClass, winRateClass } from '@/lib/format'

function RankBadge({ rank }) {
  const base = 'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold'
  if (rank === 1) return <span className={`${base} bg-yellow-400/15 text-yellow-300 ring-1 ring-yellow-400/30`}>1</span>
  if (rank === 2) return <span className={`${base} bg-zinc-400/15 text-zinc-300 ring-1 ring-zinc-400/30`}>2</span>
  if (rank === 3) return <span className={`${base} bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30`}>3</span>
  return <span className="pl-2 font-mono text-sm text-zinc-500">{rank}</span>
}

export default function LeaderboardTable({ traders, followerMap }) {
  const router = useRouter()

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-left">
              {['Rank', 'Trader', 'Total PnL', 'PnL %', 'Win Rate', 'Trades', 'Followers'].map((h) => (
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
            {traders.map((trader, i) => (
              <tr
                key={trader.wallet_address}
                onClick={() => router.push(`/trader/${trader.wallet_address}`)}
                className="cursor-pointer transition-colors hover:bg-white/[0.05]"
              >
                <td className="px-5 py-4">
                  <RankBadge rank={i + 1} />
                </td>
                <td className="px-5 py-4">
                  <p className="font-mono font-medium text-zinc-100">
                    {shortenAddress(trader.wallet_address)}
                  </p>
                </td>
                <td className={`px-5 py-4 font-semibold tabular-nums ${pnlClass(trader.total_pnl)}`}>
                  {formatPnl(trader.total_pnl)}
                </td>
                <td className={`px-5 py-4 tabular-nums ${pnlClass(trader.total_pnl)}`}>
                  {trader.total_pnl != null
                    ? `${trader.total_pnl >= 0 ? '+' : ''}${trader.total_pnl.toFixed(2)}%`
                    : '—'}
                </td>
                <td className={`px-5 py-4 tabular-nums ${winRateClass(trader.win_rate)}`}>
                  {trader.win_rate != null ? `${trader.win_rate.toFixed(1)}%` : '—'}
                </td>
                <td className="px-5 py-4 tabular-nums text-zinc-300">
                  {(trader.trade_count ?? 0).toLocaleString()}
                </td>
                <td className="px-5 py-4 tabular-nums text-zinc-500">
                  {followerMap[trader.wallet_address] ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
