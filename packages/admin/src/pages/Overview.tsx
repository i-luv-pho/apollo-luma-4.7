import { createMemo, For, Show } from "solid-js"
import { getStats, users, transactions, tierConfig } from "../data/mock"

export default function Overview() {
  const stats = createMemo(() => getStats())
  const hasData = createMemo(() => users.length > 0)

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Overview</h1>

      {/* Stats */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">MRR</p>
          <p class="text-2xl font-bold text-white mt-1">${stats().mrr.toLocaleString()}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Users</p>
          <p class="text-2xl font-bold text-white mt-1">{stats().totalUsers}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Active</p>
          <p class="text-2xl font-bold text-white mt-1">{stats().activeUsers}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">API Cost</p>
          <p class="text-2xl font-bold text-white mt-1">${stats().estimatedCost.toFixed(0)}</p>
        </div>
      </div>

      <Show
        when={hasData()}
        fallback={
          <div class="bg-[#1a1a1a] rounded-xl p-12 border border-[#2a2a2a] text-center">
            <div class="w-12 h-12 rounded-full bg-[#262626] mx-auto mb-4 flex items-center justify-center">
              <svg class="w-6 h-6 text-[#71717a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p class="text-[#71717a]">Connect Supabase to see data</p>
            <p class="text-[#52525b] text-sm mt-1">User and transaction data will appear here</p>
          </div>
        }
      >
        {/* Tier breakdown */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
            <h2 class="text-white font-medium mb-4">Users by Tier</h2>
            <div class="space-y-3">
              <For each={Object.entries(tierConfig)}>
                {([key, tier]) => {
                  const count = () => {
                    if (key === "free") return stats().freeUsers
                    if (key === "pro") return stats().proUsers
                    return stats().unlimitedUsers
                  }
                  return (
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full" style={{ background: tier.color }} />
                        <span class="text-[#a1a1aa]">{tier.name}</span>
                      </div>
                      <span class="text-white">{count()}</span>
                    </div>
                  )
                }}
              </For>
            </div>
          </div>

          <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
            <h2 class="text-white font-medium mb-4">Recent Transactions</h2>
            <Show
              when={transactions.length > 0}
              fallback={<p class="text-[#52525b] text-sm">No transactions yet</p>}
            >
              <div class="space-y-2">
                <For each={transactions.slice(0, 5)}>
                  {(txn) => (
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-[#a1a1aa]">{txn.userEmail}</span>
                      <span class="text-white">${(txn.amount / 100).toFixed(0)}</span>
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
