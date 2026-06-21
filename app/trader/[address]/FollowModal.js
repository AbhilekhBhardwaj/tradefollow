'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function FollowModal({ traderAddress }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubscribe() {
    const clean = username.trim().replace(/^@/, '')
    if (!clean) return
    setLoading(true)
    setError(null)
    const { error: dbErr } = await supabase
      .from('followers')
      .insert({ trader_address: traderAddress, telegram_username: clean })
    setLoading(false)
    if (dbErr) {
      setError('Something went wrong. Please try again.')
    } else {
      setSuccess(true)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan-400 active:scale-95"
      >
        Follow This Trader
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1117] p-6 shadow-2xl">
            {success ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">You&apos;re in!</h3>
                  <p className="mt-1.5 text-sm text-zinc-400">
                    You will now receive alerts on Telegram when this trader makes a move.
                  </p>
                </div>
                <button
                  onClick={() => { setOpen(false); setSuccess(false); setUsername('') }}
                  className="mt-2 rounded-lg border border-white/10 px-5 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              /* ── Subscribe form ── */
              <>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Follow This Trader</h2>
                    <p className="mt-0.5 text-sm text-zinc-500">Get instant Telegram alerts on every trade</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Plan card */}
                <div className="mb-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-cyan-400">Pro Alerts</span>
                    <span className="text-xl font-bold text-white">$29<span className="text-sm font-normal text-zinc-500">/month</span></span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-zinc-400">
                    {[
                      'Real-time Telegram alerts on every trade',
                      'Entry price, size & leverage notifications',
                      'Open & close position tracking',
                      'Cancel anytime',
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-cyan-500">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Telegram input */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Your Telegram Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                    placeholder="@yourusername"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  />
                  {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={loading || !username.trim()}
                  className="w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Subscribing…' : 'Subscribe — $29/month'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
