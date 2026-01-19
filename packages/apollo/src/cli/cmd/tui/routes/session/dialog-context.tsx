import { createMemo, Show } from "solid-js"
import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import { useTheme } from "../../context/theme"
import { useSync } from "../../context/sync"
import { useDialog } from "../../ui/dialog"
import type { AssistantMessage } from "@apollo-ai/sdk/v2"

interface Props {
  sessionID: string
}

export function DialogContext(props: Props) {
  const dialog = useDialog()
  const { theme } = useTheme()
  const sync = useSync()

  useKeyboard((evt) => {
    if (evt.name === "return" || evt.name === "escape") {
      dialog.clear()
    }
  })

  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])

  // Get the last assistant message with token info
  const lastAssistant = createMemo(
    () => messages().findLast((x) => x.role === "assistant" && x.tokens?.output > 0) as AssistantMessage | undefined,
  )

  // Get model info
  const model = createMemo(() => {
    const msg = lastAssistant()
    if (!msg) return undefined
    return sync.data.provider.find((x) => x.id === msg.providerID)?.models[msg.modelID]
  })

  // Calculate totals
  const stats = createMemo(() => {
    const msg = lastAssistant()
    if (!msg) {
      return {
        input: 0,
        output: 0,
        reasoning: 0,
        cacheRead: 0,
        cacheWrite: 0,
        total: 0,
        contextLimit: 0,
        percentage: 0,
      }
    }

    const input = msg.tokens.input
    const output = msg.tokens.output
    const reasoning = msg.tokens.reasoning
    const cacheRead = msg.tokens.cache.read
    const cacheWrite = msg.tokens.cache.write
    const total = input + output + reasoning + cacheRead + cacheWrite
    const contextLimit = model()?.limit.context || 0
    const percentage = contextLimit > 0 ? (total / contextLimit) * 100 : 0

    return {
      input,
      output,
      reasoning,
      cacheRead,
      cacheWrite,
      total,
      contextLimit,
      percentage,
    }
  })

  // Message counts
  const messageCounts = createMemo(() => {
    const msgs = messages()
    const user = msgs.filter((m) => m.role === "user").length
    const assistant = msgs.filter((m) => m.role === "assistant").length
    return { user, assistant, total: msgs.length }
  })

  // Progress bar
  const progressBar = createMemo(() => {
    const pct = stats().percentage
    const width = 40
    const filled = Math.round((pct / 100) * width)
    const empty = width - filled
    return "\u2588".repeat(filled) + "\u2591".repeat(empty)
  })

  // Auto-compact threshold (95%)
  const autoCompactAt = createMemo(() => {
    const limit = stats().contextLimit
    if (limit === 0) return 0
    return Math.round(limit * 0.95)
  })

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} flexDirection="column">
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          Context Usage
        </text>
        <text fg={theme.textMuted}>esc/enter</text>
      </box>

      <Show when={lastAssistant()} fallback={<text fg={theme.textMuted}>No messages yet</text>}>
        {/* Main token display */}
        <box flexDirection="column">
          <text fg={theme.text}>
            Tokens Used:{" "}
            <span style={{ fg: theme.primary }}>{stats().total.toLocaleString()}</span>
            <Show when={stats().contextLimit > 0}>
              {" "}
              / {stats().contextLimit.toLocaleString()} ({stats().percentage.toFixed(1)}%)
            </Show>
          </text>
          <Show when={stats().contextLimit > 0}>
            <text fg={stats().percentage > 80 ? theme.warning : theme.success}>{progressBar()}</text>
          </Show>
        </box>

        {/* Breakdown */}
        <box flexDirection="column" marginTop={1}>
          <text fg={theme.textMuted}>Breakdown:</text>
          <text fg={theme.text}>
            {"  "}Input tokens:{" "}
            <span style={{ fg: theme.primary }}>{stats().input.toLocaleString()}</span>
          </text>
          <text fg={theme.text}>
            {"  "}Output tokens:{" "}
            <span style={{ fg: theme.primary }}>{stats().output.toLocaleString()}</span>
          </text>
          <Show when={stats().reasoning > 0}>
            <text fg={theme.text}>
              {"  "}Reasoning tokens:{" "}
              <span style={{ fg: theme.primary }}>{stats().reasoning.toLocaleString()}</span>
            </text>
          </Show>
          <Show when={stats().cacheRead > 0}>
            <text fg={theme.text}>
              {"  "}Cache read:{" "}
              <span style={{ fg: theme.success }}>{stats().cacheRead.toLocaleString()}</span>
            </text>
          </Show>
          <Show when={stats().cacheWrite > 0}>
            <text fg={theme.text}>
              {"  "}Cache write:{" "}
              <span style={{ fg: theme.primary }}>{stats().cacheWrite.toLocaleString()}</span>
            </text>
          </Show>
        </box>

        {/* Message counts */}
        <box flexDirection="column" marginTop={1}>
          <text fg={theme.text}>
            Messages: {messageCounts().total} ({messageCounts().user} user, {messageCounts().assistant} assistant)
          </text>
        </box>

        {/* Model info */}
        <Show when={model()}>
          <box flexDirection="column" marginTop={1}>
            <text fg={theme.textMuted}>
              Model: Apollo/Luna 4.7
            </text>
          </box>
        </Show>

        {/* Auto-compact info */}
        <Show when={autoCompactAt() > 0}>
          <box flexDirection="column" marginTop={1}>
            <text fg={theme.textMuted}>Auto-compact at: {autoCompactAt().toLocaleString()} tokens (95%)</text>
          </box>
        </Show>
      </Show>

      <box flexDirection="row" justifyContent="flex-end" paddingBottom={1} marginTop={1}>
        <box paddingLeft={3} paddingRight={3} backgroundColor={theme.primary} onMouseUp={() => dialog.clear()}>
          <text fg={theme.selectedListItemText}>ok</text>
        </box>
      </box>
    </box>
  )
}
