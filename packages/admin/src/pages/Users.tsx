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
      <h1 class="text-2xl font-bold text-white fade-in-up">Users</h1>

      {/* Filters */}
      <div class="flex gap-3 fade-in-up stagger-1">
        <input
          type="text"
          placeholder="Search by email..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="input-modern flex-1 max-w-xs"
        />
        <select
          value={statusFilter()}
          onChange={(e) => setStatusFilter(e.currentTarget.value)}
          class="input-modern w-40"
        >
          <option value="all">All users</option>
          <option value="activated">Activated</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div class="glass-card overflow-hidden fade-in-up stagger-2">
        <Show
          when={!users.loading && (users() || []).length > 0}
          fallback={
            <div class="p-12 text-center">
              <Show when={users.loading}>
                <div class="flex flex-col items-center gap-4">
                  <div class="spinner" />
                  <p class="text-[#71717a]">Loading users...</p>
                </div>
              </Show>
              <Show when={!users.loading}>
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 mx-auto mb-4 flex items-center justify-center float">
                  <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p class="text-white font-medium text-lg">No users yet</p>
                <p class="text-[#71717a] text-sm mt-2">Users will appear here when they sign up</p>
              </Show>
            </div>
          }
        >
          <table class="table-modern">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Usage</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredUsers()}>
                {(user, index) => (
                  <tr class="fade-in" style={{ "animation-delay": `${index() * 0.05}s` }}>
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                          <span class="text-indigo-400 text-sm font-medium">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p class="text-white">{user.email}</p>
                      </div>
                    </td>
                    <td>
                      <span
                        class="badge"
                        classList={{
                          "badge-success": user.activated,
                          "badge-warning": !user.activated,
                        }}
                      >
                        {user.activated ? "Activated" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min((user.decks_used / user.decks_limit) * 100, 100)}%`,
                              background: user.decks_used >= user.decks_limit
                                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            }}
                          />
                        </div>
                        <span class="text-[#71717a] text-sm font-medium">
                          {user.decks_used}/{user.decks_limit}
                        </span>
                      </div>
                    </td>
                    <td class="text-[#71717a] text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedUser(user)}
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717a] hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      {/* Modal with animation */}
      <Show when={selectedUser()}>
        <div
          class="fixed inset-0 flex items-center justify-center z-50"
          onClick={() => setSelectedUser(null)}
        >
          {/* Backdrop */}
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm fade-in" />

          {/* Modal */}
          <div
            class="relative glass-card w-full max-w-sm p-6 m-4 fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex justify-between items-start mb-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <span class="text-white text-lg font-bold">
                    {selectedUser()!.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p class="text-white font-semibold">{selectedUser()!.email}</p>
                  <span
                    class="badge mt-1"
                    classList={{
                      "badge-success": selectedUser()!.activated,
                      "badge-warning": !selectedUser()!.activated,
                    }}
                  >
                    {selectedUser()!.activated ? "Activated" : "Pending"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                class="w-8 h-8 rounded-lg flex items-center justify-center text-[#71717a] hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="mb-6 p-4 rounded-xl bg-white/5">
              <p class="text-[#71717a] text-sm mb-2">Deck Usage</p>
              <div class="flex items-end gap-2 mb-3">
                <p class="text-3xl font-bold text-white">{selectedUser()!.decks_used}</p>
                <p class="text-[#71717a] mb-1">/ {selectedUser()!.decks_limit}</p>
              </div>
              <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((selectedUser()!.decks_used / selectedUser()!.decks_limit) * 100, 100)}%`,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                />
              </div>
            </div>

            <div class="space-y-3">
              <button
                onClick={() => toggleActivation(selectedUser()!)}
                disabled={updating()}
                class="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 ripple"
                classList={{
                  "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40": !selectedUser()!.activated,
                  "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40": selectedUser()!.activated,
                }}
              >
                {updating() ? (
                  <div class="flex items-center justify-center gap-2">
                    <div class="spinner w-4 h-4 border-2" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  selectedUser()!.activated ? "Deactivate User" : "Activate User"
                )}
              </button>

              <div class="flex gap-2">
                <button
                  onClick={() => updateLimit(selectedUser()!, selectedUser()!.decks_limit + 10)}
                  disabled={updating()}
                  class="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all duration-200"
                >
                  +10 Decks
                </button>
                <button
                  onClick={() => updateLimit(selectedUser()!, selectedUser()!.decks_limit + 50)}
                  disabled={updating()}
                  class="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all duration-200"
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
