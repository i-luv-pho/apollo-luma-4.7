import { createSignal, createMemo, Show, createEffect } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import type { TextareaRenderable } from "@opentui/core"
import { useDialog } from "../../ui/dialog"
import { useTheme } from "../../context/theme"
import { useKeybind } from "../../context/keybind"
import { usePromptHistory, type PromptInfo } from "./history"
import { useTextareaKeybindings } from "../textarea-keybindings"

interface HistorySearchProps {
  onSelect: (item: PromptInfo) => void
  onCancel: () => void
}

interface HighlightParts {
  before: string
  matched: string
  after: string
}

export function HistorySearch(props: HistorySearchProps) {
  let input: TextareaRenderable
  const dialog = useDialog()
  const { theme } = useTheme()
  const keybind = useKeybind()
  const history = usePromptHistory()
  const textareaKeybindings = useTextareaKeybindings()

  const [query, setQuery] = createSignal("")
  const [currentIndex, setCurrentIndex] = createSignal<number | undefined>(undefined)

  const match = createMemo(() => {
    const q = query()
    if (!q) return undefined
    return history.search(q, currentIndex())
  })

  const matchedText = createMemo(() => {
    const m = match()
    if (!m) return undefined
    return m.entry.input
  })

  // Highlight the matched portion
  const highlightedText = createMemo((): HighlightParts | undefined => {
    const text = matchedText()
    const q = query()
    if (!text || !q) return undefined

    const lowerText = text.toLowerCase()
    const lowerQuery = q.toLowerCase()
    const idx = lowerText.indexOf(lowerQuery)
    if (idx === -1) return { before: text, matched: "", after: "" }

    const before = text.slice(0, idx)
    const matched = text.slice(idx, idx + q.length)
    const after = text.slice(idx + q.length)

    return { before, matched, after }
  })

  useKeyboard((evt) => {
    // Ctrl+R again to search for older match
    if (keybind.match("history_search", evt)) {
      evt.preventDefault()
      const m = match()
      if (m) {
        setCurrentIndex(m.index)
      }
      return
    }

    // Enter to select
    if (evt.name === "return") {
      evt.preventDefault()
      const m = match()
      if (m) {
        props.onSelect(m.entry)
      }
      dialog.clear()
      return
    }

    // Escape to cancel
    if (evt.name === "escape") {
      evt.preventDefault()
      props.onCancel()
      dialog.clear()
      return
    }

    // Ctrl+C to cancel
    if (evt.ctrl && evt.name === "c") {
      evt.preventDefault()
      props.onCancel()
      dialog.clear()
      return
    }

    // Ctrl+G to cancel (like bash)
    if (evt.ctrl && evt.name === "g") {
      evt.preventDefault()
      props.onCancel()
      dialog.clear()
      return
    }
  })

  return (
    <box paddingLeft={2} paddingRight={2} flexDirection="column" gap={1} paddingBottom={1}>
      <box flexDirection="row" gap={1}>
        <text fg={theme.textMuted}>(reverse-i-search)`</text>
        <textarea
          ref={(r: TextareaRenderable) => {
            input = r
            r?.focus()
          }}
          height={1}
          flexGrow={1}
          cursorColor={theme.text}
          textColor={theme.text}
          focusedTextColor={theme.text}
          keyBindings={textareaKeybindings()}
          onContentChange={() => {
            setQuery(input.plainText)
            setCurrentIndex(undefined) // Reset search position on new query
          }}
        />
        <text fg={theme.textMuted}>':</text>
      </box>

      <Show when={query()}>
        <Show
          when={match()}
          fallback={
            <text fg={theme.error}>
              (no match for "{query()}")
            </text>
          }
        >
          <box flexDirection="row">
            <Show when={highlightedText()}>
              {(hl) => (
                <text fg={theme.text}>
                  {hl().before}
                  <Show when={hl().matched}>
                    <span style={{ bg: theme.warning, fg: theme.background }}>{hl().matched}</span>
                  </Show>
                  {hl().after.split("\n")[0]}
                </text>
              )}
            </Show>
          </box>
        </Show>
      </Show>

      <box flexDirection="row" gap={2} marginTop={1}>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>{keybind.print("history_search")}</span> older match
        </text>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>Enter</span> select
        </text>
        <text fg={theme.textMuted}>
          <span style={{ fg: theme.text }}>Esc</span> cancel
        </text>
      </box>
    </box>
  )
}
