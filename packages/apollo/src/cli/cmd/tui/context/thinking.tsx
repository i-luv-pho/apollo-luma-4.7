import { createSignal, createMemo, createEffect } from "solid-js"
import { createSimpleContext } from "./helper"
import { useKV } from "./kv"
import { useLocal } from "./local"
import { useSync } from "./sync"

/**
 * Thinking toggle context - controls whether extended thinking is enabled.
 * When enabled, automatically selects the best thinking variant for the current model.
 * When disabled, clears the variant to use standard (non-thinking) mode.
 */
export const { use: useThinking, provider: ThinkingProvider } = createSimpleContext({
  name: "Thinking",
  init: () => {
    const kv = useKV()
    const local = useLocal()
    const sync = useSync()

    // Persist enabled state
    const [enabled, setEnabled] = createSignal(kv.get("thinking_enabled", true))

    createEffect(() => {
      if (kv.ready) {
        kv.set("thinking_enabled", enabled())
      }
    })

    // Get available variants for current model
    const variants = createMemo(() => {
      const model = local.model.current()
      if (!model) return []
      const provider = sync.data.provider.find((x) => x.id === model.providerID)
      const info = provider?.models[model.modelID]
      if (!info?.variants) return []
      return Object.keys(info.variants)
    })

    // Check if current model supports thinking
    const supportsThinking = createMemo(() => variants().length > 0)

    // Get the preferred thinking variant (prefer "high" if available, else first)
    const preferredVariant = createMemo(() => {
      const v = variants()
      if (v.length === 0) return undefined
      if (v.includes("high")) return "high"
      return v[0]
    })

    // Sync enabled state with variant
    createEffect(() => {
      if (!supportsThinking()) return

      if (enabled()) {
        // If thinking enabled, set to preferred variant if not already set
        const currentVariant = local.model.variant.current()
        if (!currentVariant) {
          const pref = preferredVariant()
          if (pref) local.model.variant.set(pref)
        }
      } else {
        // If thinking disabled, clear the variant
        const currentVariant = local.model.variant.current()
        if (currentVariant) {
          local.model.variant.set(undefined)
        }
      }
    })

    function toggle() {
      setEnabled(!enabled())
    }

    function enable() {
      setEnabled(true)
    }

    function disable() {
      setEnabled(false)
    }

    return {
      get enabled() {
        return enabled()
      },
      get supportsThinking() {
        return supportsThinking()
      },
      get variants() {
        return variants()
      },
      get currentVariant() {
        return local.model.variant.current()
      },
      toggle,
      enable,
      disable,
    }
  },
})
