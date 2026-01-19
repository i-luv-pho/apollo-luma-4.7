import { createSignal, createMemo, createEffect } from "solid-js"
import { createSimpleContext } from "./helper"
import { useKV } from "./kv"

export type OperationMode = "default" | "auto-accept" | "plan"

export const OPERATION_MODES: OperationMode[] = ["default", "auto-accept", "plan"]

export const OPERATION_MODE_LABELS: Record<OperationMode, string> = {
  default: "Default",
  "auto-accept": "Auto-accept",
  plan: "Plan",
}

export const OPERATION_MODE_ICONS: Record<OperationMode, string> = {
  default: "",
  "auto-accept": "⏵⏵",
  plan: "⏸",
}

export const OPERATION_MODE_DESCRIPTIONS: Record<OperationMode, string> = {
  default: "Normal operation - prompts for edit approval",
  "auto-accept": "Automatically accepts all file edits",
  plan: "Read-only exploration mode - no edits allowed",
}

export const { use: useOperationMode, provider: OperationModeProvider } = createSimpleContext({
  name: "OperationMode",
  init: () => {
    const kv = useKV()

    // Get initial mode from persistent storage
    const initialMode = (kv.get("operation_mode", "default") as OperationMode) || "default"
    const [mode, setMode] = createSignal<OperationMode>(initialMode)

    // Persist mode changes
    createEffect(() => {
      if (kv.ready) {
        kv.set("operation_mode", mode())
      }
    })

    function cycle(direction: 1 | -1 = 1) {
      const currentIndex = OPERATION_MODES.indexOf(mode())
      let nextIndex = currentIndex + direction
      if (nextIndex < 0) nextIndex = OPERATION_MODES.length - 1
      if (nextIndex >= OPERATION_MODES.length) nextIndex = 0
      setMode(OPERATION_MODES[nextIndex])
    }

    function set(newMode: OperationMode) {
      if (OPERATION_MODES.includes(newMode)) {
        setMode(newMode)
      }
    }

    return {
      get current() {
        return mode()
      },
      get label() {
        return OPERATION_MODE_LABELS[mode()]
      },
      get icon() {
        return OPERATION_MODE_ICONS[mode()]
      },
      get description() {
        return OPERATION_MODE_DESCRIPTIONS[mode()]
      },
      get isAutoAccept() {
        return mode() === "auto-accept"
      },
      get isPlanMode() {
        return mode() === "plan"
      },
      get isDefault() {
        return mode() === "default"
      },
      cycle,
      set,
    }
  },
})
