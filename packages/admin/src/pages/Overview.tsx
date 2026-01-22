import { createMemo, For, Show } from "solid-js"
import { getStats, users, transactions, tierConfig } from "../data/mock"

export default function Overview() {
  const stats = createMemo(() => getStats())
  const hasData = createMemo(() => users.length > 0)

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-white fade-in-up">Overview</h1>

      {/* Stats Grid with staggered animation */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card fade-in-up stagger-1">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-[#71717a] text-sm font-medium">MRR</p>
          </div>
          <p class="stat-value">${stats().mrr.toLocaleString()}</p>
        </div>

        <div class="stat-card fade-in-up stagger-2">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p class="text-[#71717a] text-sm font-medium">Users</p>
          </div>
          <p class="stat-value">{stats().totalUsers}</p>
        </div>

        <div class="stat-card fade-in-up stagger-3">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p class="text-[#71717a] text-sm font-medium">Active</p>
          </div>
          <p class="stat-value">{stats().activeUsers}</p>
        </div>

        <div class="stat-card fade-in-up stagger-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-[#71717a] text-sm font-medium">API Cost</p>
          </div>
          <p class="stat-value">${stats().estimatedCost.toFixed(0)}</p>
        </div>
      </div>

      <Show
        when={hasData()}
        fallback={
          <div class="glass-card p-12 text-center fade-in-up stagger-5">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 mx-auto mb-4 flex items-center justify-center float">
              <svg class="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p class="text-white font-medium text-lg">Connect Supabase to see data</p>
            <p class="text-[#71717a] text-sm mt-2">User and transaction data will appear here</p>
            <button class="btn-glow mt-6">
              Connect Database
            </button>
          </div>
        }
      >
        {/* Tier breakdown */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="glass-card p-6 fade-in-up stagger-5">
            <h2 class="text-white font-semibold mb-4 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-indigo-500" />
              Users by Tier
            </h2>
            <div class="space-y-4">
              <For each={Object.entries(tierConfig)}>
                {([key, tier], index) => {
                  const count = () => {
                    if (key === "free") return stats().freeUsers
                    if (key === "pro") return stats().proUsers
                    return stats().unlimitedUsers
                  }
                  const total = () => stats().totalUsers || 1
                  const percentage = () => Math.round((count() / total()) * 100)

                  return (
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <div class="w-3 h-3 rounded-full" style={{ background: tier.color }} />
                          <span class="text-[#a1a1aa] font-medium">{tier.name}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-white font-semibold">{count()}</span>
                          <span class="text-[#52525b] text-sm">({percentage()}%)</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage()}%`,
                            background: tier.color
                          }}
                        />
                      </div>
                    </div>
                  )
                }}
              </For>
            </div>
          </div>

          <div class="glass-card p-6 fade-in-up stagger-6">
            <h2 class="text-white font-semibold mb-4 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-500" />
              Recent Transactions
            </h2>
            <Show
              when={transactions.length > 0}
              fallback={
                <div class="text-center py-8">
                  <div class="w-12 h-12 rounded-xl bg-white/5 mx-auto mb-3 flex items-center justify-center">
                    <svg class="w-6 h-6 text-[#52525b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p class="text-[#52525b] text-sm">No transactions yet</p>
                </div>
              }
            >
              <div class="space-y-3">
                <For each={transactions.slice(0, 5)}>
                  {(txn, index) => (
                    <div
                      class="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200"
                      style={{ "animation-delay": `${index() * 0.1}s` }}
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span class="text-[#a1a1aa] text-sm">{txn.userEmail}</span>
                      </div>
                      <span class="text-emerald-400 font-semibold">+${(txn.amount / 100).toFixed(0)}</span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  )
}
