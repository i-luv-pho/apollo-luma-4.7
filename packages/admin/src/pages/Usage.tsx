import { createMemo, For, Show } from "solid-js"
import { getStats, users, tierConfig } from "../data/mock"

export default function Usage() {
  const stats = createMemo(() => getStats())
  const hasData = createMemo(() => users.length > 0)

  const topUsers = createMemo(() =>
    [...users].sort((a, b) => b.tokensUsed - a.tokensUsed).slice(0, 5)
  )

  const usersNearLimit = createMemo(() =>
    users.filter(u => u.tokensUsed / u.tokensLimit > 0.8)
  )

  const estimatedCost = createMemo(() => (stats().totalTokens / 1_000_000) * 10)

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Usage</h1>

      {/* Stats */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Total Tokens</p>
          <p class="text-2xl font-bold text-white mt-1">{formatNumber(stats().totalTokens)}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">API Cost</p>
          <p class="text-2xl font-bold text-white mt-1">${estimatedCost().toFixed(0)}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Active Users</p>
          <p class="text-2xl font-bold text-white mt-1">{stats().activeUsers}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Near Limit</p>
          <p class="text-2xl font-bold text-yellow-500 mt-1">{usersNearLimit().length}</p>
        </div>
      </div>

      <Show
        when={hasData()}
        fallback={
          <div class="bg-[#1a1a1a] rounded-xl p-12 border border-[#2a2a2a] text-center">
            <p class="text-[#71717a]">No usage data yet</p>
            <p class="text-[#52525b] text-sm mt-1">Connect Supabase to see usage analytics</p>
          </div>
        }
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top users */}
          <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
            <h2 class="text-white font-medium mb-4">Top Users</h2>
            <div class="space-y-3">
              <For each={topUsers()}>
                {(user) => (
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-[#a1a1aa] truncate">{user.email}</span>
                    </div>
                    <span class="text-white ml-2">{formatNumber(user.tokensUsed)}</span>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Near limit */}
          <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
            <h2 class="text-white font-medium mb-4">Near Limit</h2>
            <Show
              when={usersNearLimit().length > 0}
              fallback={<p class="text-[#52525b] text-sm">No users near their limit</p>}
            >
              <div class="space-y-3">
                <For each={usersNearLimit()}>
                  {(user) => {
                    const pct = Math.round((user.tokensUsed / user.tokensLimit) * 100)
                    return (
                      <div>
                        <div class="flex justify-between text-sm mb-1">
                          <span class="text-[#a1a1aa] truncate">{user.email}</span>
                          <span class={pct >= 100 ? "text-red-500" : "text-yellow-500"}>{pct}%</span>
                        </div>
                        <div class="h-1.5 bg-[#262626] rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full"
                            classList={{ "bg-red-500": pct >= 100, "bg-yellow-500": pct < 100 }}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  }}
                </For>
              </div>
            </Show>
          </div>
        </div>

        {/* Cost breakdown */}
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <h2 class="text-white font-medium mb-4">Cost Analysis</h2>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p class="text-[#52525b] text-sm">API Cost</p>
              <p class="text-xl font-bold text-white">${estimatedCost().toFixed(0)}</p>
            </div>
            <div>
              <p class="text-[#52525b] text-sm">Revenue</p>
              <p class="text-xl font-bold text-green-500">${stats().mrr}</p>
            </div>
            <div>
              <p class="text-[#52525b] text-sm">Margin</p>
              <p class="text-xl font-bold text-white">
                {stats().mrr > 0 ? Math.round(((stats().mrr - estimatedCost()) / stats().mrr) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
