import { createMemo, For, Show } from "solid-js"
import { getStats, transactions, tierConfig } from "../data/mock"

export default function Revenue() {
  const stats = createMemo(() => getStats())
  const hasData = createMemo(() => transactions.length > 0)

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Revenue</h1>

      {/* Stats */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">MRR</p>
          <p class="text-2xl font-bold text-white mt-1">${stats().mrr.toLocaleString()}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">ARR</p>
          <p class="text-2xl font-bold text-white mt-1">${stats().arr.toLocaleString()}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Pro Users</p>
          <p class="text-2xl font-bold text-white mt-1">{stats().proUsers}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Unlimited Users</p>
          <p class="text-2xl font-bold text-white mt-1">{stats().unlimitedUsers}</p>
        </div>
      </div>

      {/* Tier breakdown */}
      <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
        <h2 class="text-white font-medium mb-4">Revenue by Tier</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" style={{ background: tierConfig.pro.color }} />
              <span class="text-[#a1a1aa]">Pro</span>
            </div>
            <span class="text-white">${(stats().proUsers * tierConfig.pro.price).toLocaleString()}/mo</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" style={{ background: tierConfig.unlimited.color }} />
              <span class="text-[#a1a1aa]">Unlimited</span>
            </div>
            <span class="text-white">${(stats().unlimitedUsers * tierConfig.unlimited.price).toLocaleString()}/mo</span>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div class="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <div class="p-5 border-b border-[#2a2a2a]">
          <h2 class="text-white font-medium">Recent Transactions</h2>
        </div>
        <Show
          when={hasData()}
          fallback={
            <div class="p-12 text-center">
              <p class="text-[#71717a]">No transactions yet</p>
              <p class="text-[#52525b] text-sm mt-1">Connect Stripe to see transactions</p>
            </div>
          }
        >
          <table class="w-full">
            <thead>
              <tr class="text-left text-[#71717a] text-sm border-b border-[#2a2a2a]">
                <th class="px-4 py-3 font-medium">User</th>
                <th class="px-4 py-3 font-medium">Amount</th>
                <th class="px-4 py-3 font-medium">Tier</th>
                <th class="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <For each={transactions}>
                {(txn) => (
                  <tr class="border-b border-[#2a2a2a] last:border-0">
                    <td class="px-4 py-3 text-white">{txn.userEmail}</td>
                    <td class="px-4 py-3 text-white">${(txn.amount / 100).toFixed(0)}</td>
                    <td class="px-4 py-3">
                      <span
                        class="px-2 py-1 rounded text-xs"
                        style={{
                          background: `${tierConfig[txn.tier].color}20`,
                          color: tierConfig[txn.tier].color,
                        }}
                      >
                        {txn.tier}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="px-2 py-1 rounded text-xs"
                        classList={{
                          "bg-green-500/10 text-green-500": txn.status === "succeeded",
                          "bg-red-500/10 text-red-500": txn.status === "failed",
                          "bg-yellow-500/10 text-yellow-500": txn.status === "pending",
                        }}
                      >
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>
    </div>
  )
}
