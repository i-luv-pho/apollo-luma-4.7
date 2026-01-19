import { createSignal, For } from "solid-js"
import { tierConfig } from "../data/mock"

export default function Settings() {
  const [tiers, setTiers] = createSignal([
    { id: "free", name: "Free", price: 0, tokensLimit: 250_000, enabled: true },
    { id: "pro", name: "Pro", price: 20, tokensLimit: 2_000_000, enabled: true },
    { id: "unlimited", name: "Unlimited", price: 200, tokensLimit: 25_000_000, enabled: true },
  ])

  const [features, setFeatures] = createSignal({
    signups: true,
    byok: true,
    opusAccess: true,
  })

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${num / 1_000_000}M`
    if (num >= 1_000) return `${num / 1_000}K`
    return num.toString()
  }

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-white">Settings</h1>

      {/* Tiers */}
      <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
        <h2 class="text-white font-medium mb-4">Tier Configuration</h2>
        <div class="space-y-4">
          <For each={tiers()}>
            {(tier, index) => (
              <div class="p-4 bg-[#262626] rounded-lg">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-2 h-2 rounded-full"
                      style={{ background: tierConfig[tier.id as keyof typeof tierConfig]?.color || "#6366f1" }}
                    />
                    <span class="text-white font-medium">{tier.name}</span>
                  </div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <span class="text-[#52525b] text-sm">Enabled</span>
                    <input
                      type="checkbox"
                      checked={tier.enabled}
                      onChange={(e) => {
                        const newTiers = [...tiers()]
                        newTiers[index()].enabled = e.currentTarget.checked
                        setTiers(newTiers)
                      }}
                      class="w-4 h-4"
                    />
                  </label>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[#52525b] text-xs mb-1">Price ($/mo)</label>
                    <input
                      type="number"
                      value={tier.price}
                      disabled={tier.id === "free"}
                      onChange={(e) => {
                        const newTiers = [...tiers()]
                        newTiers[index()].price = parseInt(e.currentTarget.value) || 0
                        setTiers(newTiers)
                      }}
                      class="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label class="block text-[#52525b] text-xs mb-1">Token Limit</label>
                    <div class="relative">
                      <input
                        type="number"
                        value={tier.tokensLimit}
                        onChange={(e) => {
                          const newTiers = [...tiers()]
                          newTiers[index()].tokensLimit = parseInt(e.currentTarget.value) || 0
                          setTiers(newTiers)
                        }}
                        class="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm pr-12"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] text-xs">
                        {formatNumber(tier.tokensLimit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Features */}
      <div class="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a]">
        <h2 class="text-white font-medium mb-4">Feature Flags</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-[#262626] rounded-lg">
            <div>
              <p class="text-white text-sm">New Signups</p>
              <p class="text-[#52525b] text-xs">Allow new users to register</p>
            </div>
            <input
              type="checkbox"
              checked={features().signups}
              onChange={(e) => setFeatures({ ...features(), signups: e.currentTarget.checked })}
              class="w-4 h-4"
            />
          </div>
          <div class="flex items-center justify-between p-3 bg-[#262626] rounded-lg">
            <div>
              <p class="text-white text-sm">BYOK Mode</p>
              <p class="text-[#52525b] text-xs">Allow users to bring their own API keys</p>
            </div>
            <input
              type="checkbox"
              checked={features().byok}
              onChange={(e) => setFeatures({ ...features(), byok: e.currentTarget.checked })}
              class="w-4 h-4"
            />
          </div>
          <div class="flex items-center justify-between p-3 bg-[#262626] rounded-lg">
            <div>
              <p class="text-white text-sm">Opus Access</p>
              <p class="text-[#52525b] text-xs">Enable Claude Opus for unlimited tier</p>
            </div>
            <input
              type="checkbox"
              checked={features().opusAccess}
              onChange={(e) => setFeatures({ ...features(), opusAccess: e.currentTarget.checked })}
              class="w-4 h-4"
            />
          </div>
        </div>
      </div>

      {/* Danger */}
      <div class="bg-[#1a1a1a] rounded-xl p-5 border border-red-500/20">
        <h2 class="text-red-500 font-medium mb-4">Danger Zone</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-[#262626] rounded-lg">
            <div>
              <p class="text-white text-sm">Reset All Usage</p>
              <p class="text-[#52525b] text-xs">Reset token usage for all users</p>
            </div>
            <button class="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm">
              Reset
            </button>
          </div>
          <div class="flex items-center justify-between p-3 bg-[#262626] rounded-lg">
            <div>
              <p class="text-white text-sm">Purge Inactive Users</p>
              <p class="text-[#52525b] text-xs">Remove users inactive for 90+ days</p>
            </div>
            <button class="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm">
              Purge
            </button>
          </div>
        </div>
      </div>

      <button class="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg font-medium">
        Save Changes
      </button>
    </div>
  )
}
