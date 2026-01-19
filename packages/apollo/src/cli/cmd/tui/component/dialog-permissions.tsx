import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import { useTheme } from "../context/theme"
import { useSync } from "../context/sync"
import { useDialog } from "../ui/dialog"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { PermissionConfig, PermissionRuleConfig, PermissionActionConfig } from "@apollo-ai/sdk/v2"

interface RuleDisplay {
  permission: string
  pattern: string
  action: PermissionActionConfig
}

function parsePermissionConfig(config: PermissionConfig | undefined): RuleDisplay[] {
  if (!config) return []
  const rules: RuleDisplay[] = []

  for (const [permission, value] of Object.entries(config)) {
    // Skip internal keys
    if (permission === "__originalKeys") continue

    if (typeof value === "string") {
      // Simple action like "allow" or "deny"
      rules.push({ permission, pattern: "*", action: value as PermissionActionConfig })
    } else if (typeof value === "object" && value !== null) {
      // Pattern-based rules
      for (const [pattern, action] of Object.entries(value)) {
        rules.push({ permission, pattern, action: action as PermissionActionConfig })
      }
    }
  }

  return rules
}

export function DialogPermissions() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const sync = useSync()

  const [filter, setFilter] = createSignal<"all" | "allow" | "deny" | "ask">("all")

  const rules = createMemo(() => parsePermissionConfig(sync.data.config.permission))

  const filteredRules = createMemo(() => {
    const f = filter()
    if (f === "all") return rules()
    return rules().filter((r) => r.action === f)
  })

  // Group rules by action
  const grouped = createMemo(() => {
    const allow: RuleDisplay[] = []
    const deny: RuleDisplay[] = []
    const ask: RuleDisplay[] = []

    for (const rule of rules()) {
      if (rule.action === "allow") allow.push(rule)
      else if (rule.action === "deny") deny.push(rule)
      else if (rule.action === "ask") ask.push(rule)
    }

    return { allow, deny, ask }
  })

  useKeyboard((evt) => {
    if (evt.name === "escape" || evt.name === "return") {
      dialog.clear()
    }
    if (evt.name === "1") setFilter("all")
    if (evt.name === "2") setFilter("allow")
    if (evt.name === "3") setFilter("deny")
    if (evt.name === "4") setFilter("ask")
  })

  const actionColor = (action: PermissionActionConfig) => {
    switch (action) {
      case "allow":
        return theme.success
      case "deny":
        return theme.error
      case "ask":
        return theme.warning
    }
  }

  const actionIcon = (action: PermissionActionConfig) => {
    switch (action) {
      case "allow":
        return "✓"
      case "deny":
        return "✗"
      case "ask":
        return "?"
    }
  }

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} flexDirection="column" paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          Permissions
        </text>
        <text fg={theme.textMuted}>esc/enter</text>
      </box>

      <Show when={rules().length === 0}>
        <text fg={theme.textMuted}>No permission rules configured.</text>
        <text fg={theme.textMuted}>Add rules to your .apollo/apollo.jsonc to customize permissions.</text>
      </Show>

      <Show when={rules().length > 0}>
        {/* Filter tabs */}
        <box flexDirection="row" gap={2} marginBottom={1}>
          <text
            fg={filter() === "all" ? theme.text : theme.textMuted}
            attributes={filter() === "all" ? TextAttributes.BOLD : undefined}
          >
            [1] All ({rules().length})
          </text>
          <text
            fg={filter() === "allow" ? theme.success : theme.textMuted}
            attributes={filter() === "allow" ? TextAttributes.BOLD : undefined}
          >
            [2] Allow ({grouped().allow.length})
          </text>
          <text
            fg={filter() === "deny" ? theme.error : theme.textMuted}
            attributes={filter() === "deny" ? TextAttributes.BOLD : undefined}
          >
            [3] Deny ({grouped().deny.length})
          </text>
          <text
            fg={filter() === "ask" ? theme.warning : theme.textMuted}
            attributes={filter() === "ask" ? TextAttributes.BOLD : undefined}
          >
            [4] Ask ({grouped().ask.length})
          </text>
        </box>

        {/* Rules display */}
        <box flexDirection="column" gap={0}>
          <For each={filteredRules()}>
            {(rule) => (
              <box flexDirection="row" gap={1}>
                <text fg={actionColor(rule.action)} flexShrink={0}>
                  {actionIcon(rule.action)}
                </text>
                <text fg={theme.text}>
                  <span style={{ fg: theme.primary }}>{rule.permission}</span>
                  <Show when={rule.pattern !== "*"}>
                    <span style={{ fg: theme.textMuted }}>({rule.pattern})</span>
                  </Show>
                </text>
              </box>
            )}
          </For>
        </box>

        <box marginTop={1}>
          <text fg={theme.textMuted}>
            Configure in <span style={{ fg: theme.text }}>.apollo/apollo.jsonc</span>
          </text>
        </box>
      </Show>

      <box flexDirection="row" justifyContent="flex-end" paddingBottom={1} marginTop={1}>
        <box paddingLeft={3} paddingRight={3} backgroundColor={theme.primary} onMouseUp={() => dialog.clear()}>
          <text fg={theme.selectedListItemText}>ok</text>
        </box>
      </box>
    </box>
  )
}
