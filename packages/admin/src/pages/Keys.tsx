import { createSignal, createResource, For, Show } from "solid-js"
import { getApiKeys, createApiKey, toggleApiKey, deleteApiKey, type ApiKey } from "../lib/supabase"

export default function Keys() {
  const [keys, { refetch }] = createResource(getApiKeys)
  const [showCreate, setShowCreate] = createSignal(false)
  const [newName, setNewName] = createSignal("")
  const [newLimit, setNewLimit] = createSignal(10)
  const [creating, setCreating] = createSignal(false)
  const [copiedId, setCopiedId] = createSignal<string | null>(null)

  const handleCreate = async () => {
    if (!newName()) return
    setCreating(true)
    try {
      await createApiKey(newName(), newLimit())
      setNewName("")
      setNewLimit(10)
      setShowCreate(false)
      refetch()
    } catch (e) {
      console.error(e)
    }
    setCreating(false)
  }

  const handleToggle = async (id: string, active: boolean) => {
    await toggleApiKey(id, !active)
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this API key?")) {
      await deleteApiKey(id)
      refetch()
    }
  }

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const maskKey = (key: string) => {
    return key.slice(0, 7) + "..." + key.slice(-4)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">API Keys</h1>
        <button
          onClick={() => setShowCreate(true)}
          class="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg font-medium text-sm"
        >
          Create Key
        </button>
      </div>

      {/* Create Modal */}
      <Show when={showCreate()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#2a2a2a]">
            <h2 class="text-lg font-semibold text-white mb-4">Create API Key</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-[#71717a] text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={newName()}
                  onInput={(e) => setNewName(e.currentTarget.value)}
                  placeholder="e.g., Poom, Bank"
                  class="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white"
                />
              </div>
              <div>
                <label class="block text-[#71717a] text-sm mb-1">Deck Limit</label>
                <input
                  type="number"
                  value={newLimit()}
                  onInput={(e) => setNewLimit(parseInt(e.currentTarget.value) || 10)}
                  class="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white"
                />
              </div>
              <div class="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  class="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333] text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating() || !newName()}
                  class="flex-1 px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg disabled:opacity-50"
                >
                  {creating() ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Stats */}
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Total Keys</p>
          <p class="text-2xl font-bold text-white mt-1">{keys()?.length || 0}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Active</p>
          <p class="text-2xl font-bold text-green-500 mt-1">
            {keys()?.filter((k) => k.active).length || 0}
          </p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Total Decks Used</p>
          <p class="text-2xl font-bold text-white mt-1">
            {keys()?.reduce((sum, k) => sum + k.decks_used, 0) || 0}
          </p>
        </div>
      </div>

      {/* Keys Table */}
      <div class="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <Show
          when={!keys.loading && keys()?.length}
          fallback={
            <div class="p-8 text-center text-[#71717a]">
              {keys.loading ? "Loading..." : "No API keys yet. Create one to get started."}
            </div>
          }
        >
          <table class="w-full">
            <thead>
              <tr class="border-b border-[#2a2a2a]">
                <th class="text-left text-[#71717a] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Name
                </th>
                <th class="text-left text-[#71717a] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Key
                </th>
                <th class="text-left text-[#71717a] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Usage
                </th>
                <th class="text-left text-[#71717a] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Created
                </th>
                <th class="text-left text-[#71717a] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th class="text-right text-[#71717a] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={keys()}>
                {(key) => (
                  <tr class="border-b border-[#2a2a2a] hover:bg-[#222]">
                    <td class="px-4 py-3">
                      <span class="text-white font-medium">{key.name || "Unnamed"}</span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <code class="text-[#a1a1aa] text-sm font-mono">{maskKey(key.key)}</code>
                        <button
                          onClick={() => copyKey(key.key, key.id)}
                          class="text-[#6366f1] hover:text-[#818cf8] text-xs"
                        >
                          {copiedId() === key.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <span class="text-white">
                          {key.decks_used}/{key.decks_limit}
                        </span>
                        <div class="w-16 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                          <div
                            class="h-full bg-[#6366f1] rounded-full"
                            style={{ width: `${Math.min((key.decks_used / key.decks_limit) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-[#a1a1aa] text-sm">{formatDate(key.created_at)}</td>
                    <td class="px-4 py-3">
                      <span
                        class={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          key.active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {key.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(key.id, key.active)}
                          class="text-[#71717a] hover:text-white text-sm"
                        >
                          {key.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleDelete(key.id)}
                          class="text-red-500 hover:text-red-400 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      {/* Instructions */}
      <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
        <h2 class="text-white font-medium mb-3">How to use</h2>
        <div class="text-[#a1a1aa] text-sm space-y-2">
          <p>1. Create an API key above</p>
          <p>2. Give the key to your friend</p>
          <p>3. They set it in their terminal:</p>
          <code class="block bg-[#262626] p-3 rounded-lg text-[#6366f1] mt-2">
            export APOLLO_API_KEY=sk_xxxxx
          </code>
          <p class="mt-3">4. Now they can run:</p>
          <code class="block bg-[#262626] p-3 rounded-lg text-[#6366f1] mt-2">
            apollo deck "My presentation topic"
          </code>
        </div>
      </div>
    </div>
  )
}
