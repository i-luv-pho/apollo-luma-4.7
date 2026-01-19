import { createSignal, createMemo, batch } from "solid-js"
import { createStore } from "solid-js/store"
import type { ParsedKey } from "@opentui/core"

export type VimMode = "normal" | "insert" | "visual" | "visual-line"

export interface VimState {
  mode: VimMode
  enabled: boolean
  count: string
  lastMotion: string | null
  registers: Record<string, string>
  searchPattern: string
  searchDirection: "forward" | "backward"
  lastSearch: string | null
}

export interface VimAction {
  type: "motion" | "edit" | "mode-change" | "search" | "register" | "none"
  action?: string
  count?: number
  register?: string
  searchPattern?: string
}

const MOTIONS: Record<string, string> = {
  h: "move-left",
  l: "move-right",
  j: "move-down",
  k: "move-up",
  w: "word-forward",
  b: "word-backward",
  e: "word-forward", // TODO: end of word
  "0": "line-home",
  $: "line-end",
  "^": "visual-line-home",
  gg: "buffer-home",
  G: "buffer-end",
}

const VISUAL_MOTIONS: Record<string, string> = {
  h: "select-left",
  l: "select-right",
  j: "select-down",
  k: "select-up",
  w: "select-word-forward",
  b: "select-word-backward",
  "0": "select-line-home",
  $: "select-line-end",
  "^": "select-visual-line-home",
  gg: "select-buffer-home",
  G: "select-buffer-end",
}

export function createVimMode(options?: { initialEnabled?: boolean }) {
  const [store, setStore] = createStore<VimState>({
    mode: "normal",
    enabled: options?.initialEnabled ?? false,
    count: "",
    lastMotion: null,
    registers: { '"': "" },
    searchPattern: "",
    searchDirection: "forward",
    lastSearch: null,
  })

  const [pendingKeys, setPendingKeys] = createSignal("")

  function reset() {
    setStore("count", "")
    setPendingKeys("")
  }

  function setMode(mode: VimMode) {
    batch(() => {
      setStore("mode", mode)
      reset()
    })
  }

  function toggle() {
    batch(() => {
      setStore("enabled", !store.enabled)
      if (store.enabled) {
        setStore("mode", "normal")
      }
      reset()
    })
  }

  function enable() {
    batch(() => {
      setStore("enabled", true)
      setStore("mode", "normal")
      reset()
    })
  }

  function disable() {
    batch(() => {
      setStore("enabled", false)
      reset()
    })
  }

  function getCount(): number {
    return store.count ? parseInt(store.count, 10) : 1
  }

  function handleKey(evt: ParsedKey): VimAction {
    if (!store.enabled) {
      return { type: "none" }
    }

    const key = evt.name || ""

    // Handle Escape in any mode
    if (key === "escape") {
      if (store.mode !== "normal") {
        setMode("normal")
        return { type: "mode-change", action: "normal" }
      }
      reset()
      return { type: "none" }
    }

    // Insert mode - pass through to normal editing
    if (store.mode === "insert") {
      return { type: "none" }
    }

    // Normal mode
    if (store.mode === "normal") {
      return handleNormalMode(evt)
    }

    // Visual mode
    if (store.mode === "visual" || store.mode === "visual-line") {
      return handleVisualMode(evt)
    }

    return { type: "none" }
  }

  function handleNormalMode(evt: ParsedKey): VimAction {
    const key = evt.name || ""

    // Handle count prefix (digits)
    if (/^[1-9]$/.test(key) || (store.count && /^[0-9]$/.test(key))) {
      setStore("count", store.count + key)
      return { type: "none" }
    }

    // Handle g prefix for gg
    const pending = pendingKeys()
    if (pending === "g" && key === "g") {
      setPendingKeys("")
      const count = getCount()
      reset()
      return { type: "motion", action: "buffer-home", count }
    }

    if (key === "g") {
      setPendingKeys("g")
      return { type: "none" }
    }

    // Mode changes
    if (key === "i") {
      setMode("insert")
      return { type: "mode-change", action: "insert" }
    }

    if (key === "I") {
      setMode("insert")
      return { type: "mode-change", action: "insert-line-start" }
    }

    if (key === "a") {
      setMode("insert")
      return { type: "mode-change", action: "append" }
    }

    if (key === "A") {
      setMode("insert")
      return { type: "mode-change", action: "append-line-end" }
    }

    if (key === "o") {
      setMode("insert")
      return { type: "mode-change", action: "open-below" }
    }

    if (key === "O") {
      setMode("insert")
      return { type: "mode-change", action: "open-above" }
    }

    if (key === "v") {
      setMode("visual")
      return { type: "mode-change", action: "visual" }
    }

    if (key === "V") {
      setMode("visual-line")
      return { type: "mode-change", action: "visual-line" }
    }

    // Edit commands
    if (key === "x") {
      const count = getCount()
      reset()
      return { type: "edit", action: "delete-char", count }
    }

    if (key === "d" && pending === "d") {
      setPendingKeys("")
      const count = getCount()
      reset()
      return { type: "edit", action: "delete-line", count }
    }

    if (key === "d") {
      setPendingKeys("d")
      return { type: "none" }
    }

    if (key === "c" && pending === "c") {
      setPendingKeys("")
      const count = getCount()
      reset()
      setMode("insert")
      return { type: "edit", action: "change-line", count }
    }

    if (key === "c") {
      setPendingKeys("c")
      return { type: "none" }
    }

    if (key === "y" && pending === "y") {
      setPendingKeys("")
      const count = getCount()
      reset()
      return { type: "edit", action: "yank-line", count }
    }

    if (key === "y") {
      setPendingKeys("y")
      return { type: "none" }
    }

    if (key === "p") {
      const count = getCount()
      reset()
      return { type: "edit", action: "paste-after", count }
    }

    if (key === "P") {
      const count = getCount()
      reset()
      return { type: "edit", action: "paste-before", count }
    }

    if (key === "u") {
      reset()
      return { type: "edit", action: "undo" }
    }

    if (evt.ctrl && key === "r") {
      reset()
      return { type: "edit", action: "redo" }
    }

    if (key === "D") {
      reset()
      return { type: "edit", action: "delete-to-line-end" }
    }

    if (key === "C") {
      reset()
      setMode("insert")
      return { type: "edit", action: "change-to-line-end" }
    }

    // Search
    if (key === "/") {
      setStore("searchDirection", "forward")
      return { type: "search", action: "search-forward" }
    }

    if (key === "?") {
      setStore("searchDirection", "backward")
      return { type: "search", action: "search-backward" }
    }

    if (key === "n") {
      return { type: "search", action: "search-next" }
    }

    if (key === "N") {
      return { type: "search", action: "search-prev" }
    }

    // Motions
    const motion = MOTIONS[key]
    if (motion) {
      const count = getCount()
      reset()
      return { type: "motion", action: motion, count }
    }

    reset()
    return { type: "none" }
  }

  function handleVisualMode(evt: ParsedKey): VimAction {
    const key = evt.name || ""

    // Handle g prefix for gg
    const pending = pendingKeys()
    if (pending === "g" && key === "g") {
      setPendingKeys("")
      const count = getCount()
      reset()
      return { type: "motion", action: "select-buffer-home", count }
    }

    if (key === "g") {
      setPendingKeys("g")
      return { type: "none" }
    }

    // Edit commands in visual mode
    if (key === "d" || key === "x") {
      setMode("normal")
      return { type: "edit", action: "delete-selection" }
    }

    if (key === "c") {
      setMode("insert")
      return { type: "edit", action: "change-selection" }
    }

    if (key === "y") {
      setMode("normal")
      return { type: "edit", action: "yank-selection" }
    }

    // Motions in visual mode extend selection
    const motion = VISUAL_MOTIONS[key]
    if (motion) {
      const count = getCount()
      reset()
      return { type: "motion", action: motion, count }
    }

    reset()
    return { type: "none" }
  }

  return {
    get state() {
      return store
    },
    get mode() {
      return store.mode
    },
    get enabled() {
      return store.enabled
    },
    handleKey,
    setMode,
    toggle,
    enable,
    disable,
    setYankRegister(text: string) {
      setStore("registers", '"', text)
    },
    getYankRegister() {
      return store.registers['"'] || ""
    },
  }
}

export type VimModeController = ReturnType<typeof createVimMode>
