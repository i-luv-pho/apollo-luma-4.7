import { createSignal, createResource, For, Show } from "solid-js"
import { getAssets, getAccessKeys, uploadAsset, updateAsset, deleteAsset, type Asset, type AccessKey } from "../lib/supabase"

export default function Assets() {
  const [assets, { refetch }] = createResource(getAssets)
  const [keys] = createResource(getAccessKeys)
  const [selectedKey, setSelectedKey] = createSignal<string>("")
  const [showUpload, setShowUpload] = createSignal(false)
  const [uploading, setUploading] = createSignal(false)
  const [dragOver, setDragOver] = createSignal(false)
  const [newLabel, setNewLabel] = createSignal("")
  const [newDescription, setNewDescription] = createSignal("")
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null)
  const [editingAsset, setEditingAsset] = createSignal<Asset | null>(null)

  const filteredAssets = () => {
    const all = assets() || []
    if (!selectedKey()) return all
    return all.filter(a => a.access_key_id === selectedKey())
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      setShowUpload(true)
    }
  }

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    const file = selectedFile()
    const keyId = selectedKey() || keys()?.[0]?.id
    if (!file || !keyId || !newLabel()) return

    setUploading(true)
    try {
      await uploadAsset(keyId, file, newLabel(), newDescription() || undefined)
      setShowUpload(false)
      setSelectedFile(null)
      setNewLabel("")
      setNewDescription("")
      refetch()
    } catch (e) {
      console.error(e)
      alert("Upload failed: " + (e as Error).message)
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset?")) return
    try {
      await deleteAsset(id)
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async () => {
    const asset = editingAsset()
    if (!asset) return
    try {
      await updateAsset(asset.id, { label: asset.label, description: asset.description || undefined })
      setEditingAsset(null)
      refetch()
    } catch (e) {
      console.error(e)
    }
  }

  const getKeyName = (keyId: string) => {
    const key = keys()?.find(k => k.id === keyId)
    return key?.name || "Unknown"
  }

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Assets</h1>
        <button
          onClick={() => setShowUpload(true)}
          class="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg font-medium text-sm"
        >
          Upload Asset
        </button>
      </div>

      {/* Filter by key */}
      <div class="flex gap-3">
        <select
          value={selectedKey()}
          onChange={(e) => setSelectedKey(e.currentTarget.value)}
          class="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
        >
          <option value="">All keys</option>
          <For each={keys()}>
            {(key) => <option value={key.id}>{key.name || "Unnamed"}</option>}
          </For>
        </select>
      </div>

      {/* Upload Modal */}
      <Show when={showUpload()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#2a2a2a]">
            <h2 class="text-lg font-semibold text-white mb-4">Upload Asset</h2>
            <div class="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                class={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver() ? "border-[#6366f1] bg-[#6366f1]/10" : "border-[#3a3a3a]"
                }`}
              >
                <Show
                  when={selectedFile()}
                  fallback={
                    <>
                      <p class="text-[#a1a1aa]">Drag & drop an image here</p>
                      <p class="text-[#52525b] text-sm mt-1">or</p>
                      <label class="inline-block mt-2 px-4 py-2 bg-[#262626] hover:bg-[#333] text-white rounded-lg cursor-pointer">
                        Browse files
                        <input type="file" accept="image/*" class="hidden" onChange={handleFileSelect} />
                      </label>
                    </>
                  }
                >
                  <div class="flex items-center gap-3">
                    <img
                      src={URL.createObjectURL(selectedFile()!)}
                      class="w-16 h-16 object-cover rounded"
                    />
                    <div class="text-left">
                      <p class="text-white">{selectedFile()!.name}</p>
                      <p class="text-[#52525b] text-sm">{(selectedFile()!.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </Show>
              </div>

              {/* Key selection */}
              <div>
                <label class="block text-[#71717a] text-sm mb-1">Access Key</label>
                <select
                  value={selectedKey() || keys()?.[0]?.id || ""}
                  onChange={(e) => setSelectedKey(e.currentTarget.value)}
                  class="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white"
                >
                  <For each={keys()}>
                    {(key) => <option value={key.id}>{key.name || "Unnamed"}</option>}
                  </For>
                </select>
              </div>

              {/* Label */}
              <div>
                <label class="block text-[#71717a] text-sm mb-1">Label *</label>
                <input
                  type="text"
                  value={newLabel()}
                  onInput={(e) => setNewLabel(e.currentTarget.value)}
                  placeholder="e.g., Team photo, Product screenshot"
                  class="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label class="block text-[#71717a] text-sm mb-1">Description</label>
                <textarea
                  value={newDescription()}
                  onInput={(e) => setNewDescription(e.currentTarget.value)}
                  placeholder="Describe the image so AI knows when to use it..."
                  rows={3}
                  class="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white resize-none"
                />
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowUpload(false); setSelectedFile(null); setNewLabel(""); setNewDescription("") }}
                  class="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333] text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading() || !selectedFile() || !newLabel()}
                  class="flex-1 px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg disabled:opacity-50"
                >
                  {uploading() ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Edit Modal */}
      <Show when={editingAsset()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#2a2a2a]">
            <h2 class="text-lg font-semibold text-white mb-4">Edit Asset</h2>
            <div class="space-y-4">
              <img src={editingAsset()!.public_url} class="w-full h-48 object-cover rounded-lg" />
              <div>
                <label class="block text-[#71717a] text-sm mb-1">Label</label>
                <input
                  type="text"
                  value={editingAsset()!.label}
                  onInput={(e) => setEditingAsset({ ...editingAsset()!, label: e.currentTarget.value })}
                  class="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white"
                />
              </div>
              <div>
                <label class="block text-[#71717a] text-sm mb-1">Description</label>
                <textarea
                  value={editingAsset()!.description || ""}
                  onInput={(e) => setEditingAsset({ ...editingAsset()!, description: e.currentTarget.value })}
                  rows={3}
                  class="w-full px-3 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white resize-none"
                />
              </div>
              <div class="flex gap-3">
                <button
                  onClick={() => setEditingAsset(null)}
                  class="flex-1 px-4 py-2 bg-[#262626] hover:bg-[#333] text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  class="flex-1 px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Stats */}
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Total Assets</p>
          <p class="text-2xl font-bold text-white mt-1">{assets()?.length || 0}</p>
        </div>
        <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
          <p class="text-[#71717a] text-sm">Filtered</p>
          <p class="text-2xl font-bold text-white mt-1">{filteredAssets().length}</p>
        </div>
      </div>

      {/* Assets Grid */}
      <div class="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <Show
          when={!assets.loading && filteredAssets().length > 0}
          fallback={
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              class={`p-12 text-center ${dragOver() ? "bg-[#6366f1]/10" : ""}`}
            >
              <p class="text-[#71717a]">{assets.loading ? "Loading..." : "No assets yet"}</p>
              <p class="text-[#52525b] text-sm mt-1">Drag & drop images here or click Upload</p>
            </div>
          }
        >
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            <For each={filteredAssets()}>
              {(asset) => (
                <div class="group relative bg-[#262626] rounded-lg overflow-hidden">
                  <img
                    src={asset.public_url}
                    alt={asset.label}
                    class="w-full h-32 object-cover"
                  />
                  <div class="p-3">
                    <p class="text-white font-medium text-sm truncate">{asset.label}</p>
                    <p class="text-[#52525b] text-xs truncate">{getKeyName(asset.access_key_id)}</p>
                    {asset.description && (
                      <p class="text-[#71717a] text-xs mt-1 line-clamp-2">{asset.description}</p>
                    )}
                  </div>
                  {/* Hover actions */}
                  <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => setEditingAsset(asset)}
                      class="p-1.5 bg-black/50 hover:bg-black/70 rounded text-white"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      class="p-1.5 bg-black/50 hover:bg-red-500/70 rounded text-white"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}
