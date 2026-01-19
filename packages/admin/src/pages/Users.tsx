import { createSignal, createMemo, For, Show } from "solid-js"
import { users, tierConfig, type User } from "../data/mock"

export default function Users() {
  const [search, setSearch] = createSignal("")
  const [tierFilter, setTierFilter] = createSignal<string>("all")
  const [selectedUser, setSelectedUser] = createSignal<User | null>(null)

  const filteredUsers = createMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.email.toLowerCase().includes(search().toLowerCase()) ||
        u.name.toLowerCase().includes(search().toLowerCase())
      const matchesTier = tierFilter() === "all" || u.tier === tierFilter()
      return matchesSearch && matchesTier
    })
  })

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Users</h1>

      {/* Filters */}
      <div class="flex gap-3">
        <input
          type="text"
          placeholder="Search..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="flex-1 max-w-xs px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a3a]"
        />
        <select
          value={tierFilter()}
          onChange={(e) => setTierFilter(e.currentTarget.value)}
          class="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#3a3a3a]"
        >
          <option value="all">All tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="unlimited">Unlimited</option>
        </select>
      </div>

      {/* Table */}
      <div class="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <Show
          when={users.length > 0}
          fallback={
            <div class="p-12 text-center">
              <p class="text-[#71717a]">No users yet</p>
              <p class="text-[#52525b] text-sm mt-1">Connect Supabase to see users</p>
            </div>
          }
        >
          <table class="w-full">
            <thead>
              <tr class="text-left text-[#71717a] text-sm border-b border-[#2a2a2a]">
                <th class="px-4 py-3 font-medium">User</th>
                <th class="px-4 py-3 font-medium">Tier</th>
                <th class="px-4 py-3 font-medium">Usage</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredUsers()}>
                {(user) => (
                  <tr class="border-b border-[#2a2a2a] last:border-0 hover:bg-[#262626]">
                    <td class="px-4 py-3">
                      <p class="text-white">{user.name}</p>
                      <p class="text-[#52525b] text-sm">{user.email}</p>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          background: `${tierConfig[user.tier].color}20`,
                          color: tierConfig[user.tier].color,
                        }}
                      >
                        {tierConfig[user.tier].name}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="w-24 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full"
                          style={{
                            width: `${Math.min((user.tokensUsed / user.tokensLimit) * 100, 100)}%`,
                            background: tierConfig[user.tier].color,
                          }}
                        />
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="px-2 py-1 rounded text-xs"
                        classList={{
                          "bg-green-500/10 text-green-500": user.status === "active",
                          "bg-yellow-500/10 text-yellow-500": user.status === "inactive",
                          "bg-red-500/10 text-red-500": user.status === "banned",
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <button
                        onClick={() => setSelectedUser(user)}
                        class="text-[#71717a] hover:text-white"
                      >
                        ...
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      {/* Modal */}
      <Show when={selectedUser()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div class="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div class="flex justify-between items-start mb-4">
              <div>
                <p class="text-white font-medium">{selectedUser()!.name}</p>
                <p class="text-[#52525b] text-sm">{selectedUser()!.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} class="text-[#71717a] hover:text-white">×</button>
            </div>
            <div class="space-y-2">
              <button class="w-full px-4 py-2 bg-[#262626] hover:bg-[#2a2a2a] text-white rounded-lg text-sm">
                Change Tier
              </button>
              <button class="w-full px-4 py-2 bg-[#262626] hover:bg-[#2a2a2a] text-white rounded-lg text-sm">
                Gift Tokens
              </button>
              <button class="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm">
                Ban User
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
