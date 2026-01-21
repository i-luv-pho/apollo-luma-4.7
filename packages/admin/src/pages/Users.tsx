import { createSignal, createResource, For, Show } from "solid-js"
import { supabase } from "../lib/supabase"

interface UserAccount {
  id: string
  email: string
  activated: boolean
  decks_used: number
  decks_limit: number
  created_at: string
}

async function fetchUsers(): Promise<UserAccount[]> {
  const { data, error } = await supabase
    .from("user_accounts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch users:", error)
    return []
  }
  return data || []
}

export default function Users() {
  const [users, { refetch }] = createResource(fetchUsers)
  const [search, setSearch] = createSignal("")
  const [statusFilter, setStatusFilter] = createSignal<string>("all")
  const [selectedUser, setSelectedUser] = createSignal<UserAccount | null>(null)
  const [updating, setUpdating] = createSignal(false)

  const filteredUsers = () => {
    const list = users() || []
    return list.filter(u => {
      const matchesSearch = u.email.toLowerCase().includes(search().toLowerCase())
      const matchesStatus = statusFilter() === "all" ||
        (statusFilter() === "activated" && u.activated) ||
        (statusFilter() === "pending" && !u.activated)
      return matchesSearch && matchesStatus
    })
  }

  async function toggleActivation(user: UserAccount) {
    setUpdating(true)
    const { error } = await supabase
      .from("user_accounts")
      .update({ activated: !user.activated })
      .eq("id", user.id)

    if (error) {
      console.error("Failed to update user:", error)
    } else {
      refetch()
      setSelectedUser(null)
    }
    setUpdating(false)
  }

  async function updateLimit(user: UserAccount, newLimit: number) {
    setUpdating(true)
    const { error } = await supabase
      .from("user_accounts")
      .update({ decks_limit: newLimit })
      .eq("id", user.id)

    if (error) {
      console.error("Failed to update limit:", error)
    } else {
      refetch()
      setSelectedUser(null)
    }
    setUpdating(false)
  }

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Users</h1>

      {/* Filters */}
      <div class="flex gap-3">
        <input
          type="text"
          placeholder="Search by email..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="flex-1 max-w-xs px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a3a]"
        />
        <select
          value={statusFilter()}
          onChange={(e) => setStatusFilter(e.currentTarget.value)}
          class="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#3a3a3a]"
        >
          <option value="all">All users</option>
          <option value="activated">Activated</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div class="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <Show
          when={!users.loading && (users() || []).length > 0}
          fallback={
            <div class="p-12 text-center">
              <Show when={users.loading}>
                <p class="text-[#71717a]">Loading...</p>
              </Show>
              <Show when={!users.loading}>
                <p class="text-[#71717a]">No users yet</p>
                <p class="text-[#52525b] text-sm mt-1">Users will appear here when they sign up</p>
              </Show>
            </div>
          }
        >
          <table class="w-full">
            <thead>
              <tr class="text-left text-[#71717a] text-sm border-b border-[#2a2a2a]">
                <th class="px-4 py-3 font-medium">Email</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Usage</th>
                <th class="px-4 py-3 font-medium">Joined</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredUsers()}>
                {(user) => (
                  <tr class="border-b border-[#2a2a2a] last:border-0 hover:bg-[#262626]">
                    <td class="px-4 py-3">
                      <p class="text-white">{user.email}</p>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="px-2 py-1 rounded text-xs font-medium"
                        classList={{
                          "bg-green-500/10 text-green-500": user.activated,
                          "bg-yellow-500/10 text-yellow-500": !user.activated,
                        }}
                      >
                        {user.activated ? "Activated" : "Pending"}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-20 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full bg-[#6366f1]"
                            style={{
                              width: `${Math.min((user.decks_used / user.decks_limit) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span class="text-[#71717a] text-sm">
                          {user.decks_used}/{user.decks_limit}
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-[#71717a] text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td class="px-4 py-3">
                      <button
                        onClick={() => setSelectedUser(user)}
                        class="text-[#71717a] hover:text-white px-2"
                      >
                        •••
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
                <p class="text-white font-medium">{selectedUser()!.email}</p>
                <p class="text-[#52525b] text-sm">
                  {selectedUser()!.activated ? "Activated" : "Pending approval"}
                </p>
              </div>
              <button onClick={() => setSelectedUser(null)} class="text-[#71717a] hover:text-white text-xl">×</button>
            </div>

            <div class="mb-4 p-3 bg-[#262626] rounded-lg">
              <p class="text-[#71717a] text-sm">Decks used</p>
              <p class="text-white text-lg">{selectedUser()!.decks_used} / {selectedUser()!.decks_limit}</p>
            </div>

            <div class="space-y-2">
              <button
                onClick={() => toggleActivation(selectedUser()!)}
                disabled={updating()}
                class="w-full px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                classList={{
                  "bg-green-500/10 hover:bg-green-500/20 text-green-500": !selectedUser()!.activated,
                  "bg-red-500/10 hover:bg-red-500/20 text-red-500": selectedUser()!.activated,
                }}
              >
                {selectedUser()!.activated ? "Deactivate" : "Activate"}
              </button>

              <div class="flex gap-2">
                <button
                  onClick={() => updateLimit(selectedUser()!, selectedUser()!.decks_limit + 10)}
                  disabled={updating()}
                  class="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#2a2a2a] text-white rounded-lg text-sm disabled:opacity-50"
                >
                  +10 Decks
                </button>
                <button
                  onClick={() => updateLimit(selectedUser()!, selectedUser()!.decks_limit + 50)}
                  disabled={updating()}
                  class="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#2a2a2a] text-white rounded-lg text-sm disabled:opacity-50"
                >
                  +50 Decks
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
