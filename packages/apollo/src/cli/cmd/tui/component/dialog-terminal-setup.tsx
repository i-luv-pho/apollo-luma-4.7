import { TextAttributes } from "@opentui/core"
import { useTheme } from "../context/theme"
import { useDialog } from "../ui/dialog"
import { useKeyboard } from "@opentui/solid"
import { createMemo, createSignal, For, Show, Match, Switch } from "solid-js"

interface TerminalInfo {
  name: string
  detected: boolean
  needsSetup: boolean
  instructions?: string[]
  autoConfigurable?: boolean
}

function detectTerminal(): TerminalInfo {
  const env = process.env

  // Check for specific terminals
  if (env.TERM_PROGRAM === "vscode" || env.VSCODE_INJECTION) {
    return {
      name: "VS Code Integrated Terminal",
      detected: true,
      needsSetup: true,
      autoConfigurable: true,
      instructions: [
        "Add to your keybindings.json:",
        '{',
        '  "key": "shift+enter",',
        '  "command": "workbench.action.terminal.sendSequence",',
        '  "args": { "text": "\\u001b[13;2u" },',
        '  "when": "terminalFocus"',
        '}',
      ],
    }
  }

  if (env.TERM_PROGRAM === "iTerm.app") {
    return {
      name: "iTerm2",
      detected: true,
      needsSetup: false,
    }
  }

  if (env.TERM_PROGRAM === "WezTerm" || env.WEZTERM_EXECUTABLE) {
    return {
      name: "WezTerm",
      detected: true,
      needsSetup: false,
    }
  }

  if (env.TERM_PROGRAM === "ghostty" || env.GHOSTTY_RESOURCES_DIR) {
    return {
      name: "Ghostty",
      detected: true,
      needsSetup: false,
    }
  }

  if (env.KITTY_WINDOW_ID) {
    return {
      name: "Kitty",
      detected: true,
      needsSetup: false,
    }
  }

  if (env.ALACRITTY_SOCKET || env.ALACRITTY_LOG) {
    return {
      name: "Alacritty",
      detected: true,
      needsSetup: true,
      instructions: [
        "Add to your alacritty.toml:",
        '',
        '[keyboard]',
        'bindings = [',
        '  { key = "Enter", mods = "Shift", chars = "\\u001b[13;2u" }',
        ']',
      ],
    }
  }

  if (env.WT_SESSION || env.WT_PROFILE_ID) {
    return {
      name: "Windows Terminal",
      detected: true,
      needsSetup: true,
      instructions: [
        "Add to your settings.json actions array:",
        '{',
        '  "command": { "action": "sendInput", "input": "\\u001b[13;2u" },',
        '  "keys": "shift+enter"',
        '}',
      ],
    }
  }

  if (env.WARP_IS_LOCAL_SHELL_SESSION) {
    return {
      name: "Warp",
      detected: true,
      needsSetup: true,
      instructions: [
        "Warp requires custom keybinding configuration.",
        "See Warp documentation for custom keybindings.",
      ],
    }
  }

  if (env.ZED_TERM) {
    return {
      name: "Zed Terminal",
      detected: true,
      needsSetup: true,
      instructions: [
        "Add to your keymap.json:",
        '{',
        '  "context": "Terminal",',
        '  "bindings": {',
        '    "shift-enter": ["terminal::SendKeystroke", "\\u001b[13;2u"]',
        '  }',
        '}',
      ],
    }
  }

  // Check JetBrains IDEs
  if (env.TERMINAL_EMULATOR?.includes("JetBrains") || env.IDEA_INITIAL_DIRECTORY) {
    return {
      name: "JetBrains IDE Terminal",
      detected: true,
      needsSetup: true,
      instructions: [
        "Configure in Settings > Keymap > Terminal:",
        "1. Search for 'Terminal Send Sequence'",
        "2. Add Shift+Enter keybinding",
        "3. Set sequence to: \\u001b[13;2u",
      ],
    }
  }

  // Fallback - unknown terminal
  return {
    name: env.TERM_PROGRAM || env.TERM || "Unknown Terminal",
    detected: false,
    needsSetup: false,
  }
}

export function DialogTerminalSetup() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const [copied, setCopied] = createSignal(false)

  const terminal = createMemo(() => detectTerminal())

  useKeyboard((evt) => {
    if (evt.name === "escape" || evt.name === "return") {
      dialog.clear()
    }
    if (evt.name === "c" && terminal().instructions) {
      // Copy instructions to clipboard
      const text = terminal().instructions!.join("\n")
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  })

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} flexDirection="column" paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          Terminal Setup
        </text>
        <text fg={theme.textMuted}>esc/enter</text>
      </box>

      <box flexDirection="column" gap={1}>
        <text fg={theme.text}>
          Detected: <span style={{ fg: theme.primary }}>{terminal().name}</span>
        </text>

        <Switch>
          <Match when={!terminal().detected}>
            <box gap={1}>
              <text fg={theme.warning}>Could not detect your terminal type.</text>
              <text fg={theme.textMuted}>
                If Shift+Enter for newlines isn't working, check your terminal's documentation for sending escape
                sequences.
              </text>
            </box>
          </Match>

          <Match when={terminal().needsSetup}>
            <box gap={1}>
              <text fg={theme.warning}>
                This terminal requires configuration for Shift+Enter (multi-line input).
              </text>

              <Show when={terminal().instructions}>
                <box
                  border={["left"]}
                  borderColor={theme.border}
                  paddingLeft={2}
                  backgroundColor={theme.backgroundPanel}
                  paddingTop={1}
                  paddingBottom={1}
                >
                  <For each={terminal().instructions}>{(line) => <text fg={theme.text}>{line}</text>}</For>
                </box>

                <text fg={theme.textMuted}>
                  Press <span style={{ fg: theme.text }}>c</span> to copy configuration
                  <Show when={copied()}>
                    <span style={{ fg: theme.success }}> ✓ Copied!</span>
                  </Show>
                </text>
              </Show>
            </box>
          </Match>

          <Match when={!terminal().needsSetup}>
            <box gap={1}>
              <text fg={theme.success}>✓ Your terminal should work out of the box!</text>
              <text fg={theme.textMuted}>Shift+Enter for multi-line input should work automatically.</text>
            </box>
          </Match>
        </Switch>

        <box marginTop={1}>
          <text fg={theme.textMuted}>Terminals that work out of the box:</text>
          <text fg={theme.text}>• iTerm2, WezTerm, Ghostty, Kitty</text>
        </box>

        <box>
          <text fg={theme.textMuted}>Terminals requiring setup:</text>
          <text fg={theme.text}>• VS Code, Alacritty, Zed, Warp, Windows Terminal, JetBrains</text>
        </box>
      </box>

      <box flexDirection="row" justifyContent="flex-end" paddingBottom={1} marginTop={1}>
        <box paddingLeft={3} paddingRight={3} backgroundColor={theme.primary} onMouseUp={() => dialog.clear()}>
          <text fg={theme.selectedListItemText}>ok</text>
        </box>
      </box>
    </box>
  )
}
