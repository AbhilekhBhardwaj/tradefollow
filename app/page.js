import { supabase } from '@/lib/supabase'
import Header from './components/Header'
import LeaderboardTable from './components/LeaderboardTable'
import { formatPnl, pnlClass, winRateClass } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [{ data: traders }, { data: follows }] = await Promise.all([
    supabase.from('traders').select('*').order('total_pnl', { ascending: false }),
    supabase.from('followers').select('trader_address'),
  ])

  const traderList = traders ?? []

  // Build follower count map
  const followerMap = {}
  follows?.forEach(f => {
    followerMap[f.trader_address] = (followerMap[f.trader_address] ?? 0) + 1
  })

  const totalPnl = traderList.reduce((s, t) => s + (t.total_pnl ?? 0), 0)
  const activeTradersCount = traderList.filter(t => (t.trade_count ?? 0) > 0).length
  const avgWinRate =
    activeTradersCount > 0
      ? traderList
          .filter(t => (t.trade_count ?? 0) > 0)
          .reduce((s, t) => s + (t.win_rate ?? 0), 0) / activeTradersCount
      : 0

  return (
    <div className="min-h-screen bg-[#080a0d] text-zinc-100">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Page title ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Leaderboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Top performing traders ranked by total PnL
          </p>
        </div>

        {/* ── Stats cards ── */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Total Traders
            </p>
            <p className="mt-1.5 text-2xl font-bold text-white">
              {traderList.length.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Combined PnL
            </p>
            <p className={`mt-1.5 text-2xl font-bold ${pnlClass(totalPnl)}`}>
              {formatPnl(totalPnl)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Avg Win Rate
            </p>
            <p className={`mt-1.5 text-2xl font-bold ${winRateClass(avgWinRate)}`}>
              {avgWinRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* ── Leaderboard table ── */}
        {traderList.length > 0 ? (
          <LeaderboardTable traders={traderList} followerMap={followerMap} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-8 w-8 text-zinc-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-200">No traders yet</h3>
            <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
              Be the first to connect your wallet and claim the top spot.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
