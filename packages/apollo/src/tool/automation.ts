import z from "zod"
import { Tool } from "./tool"
import { spawn, exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"
import DESCRIPTION from "./automation.txt"
import { Log } from "../util/log"
import { Instance } from "../project/instance"

const execAsync = promisify(exec)
const log = Log.create({ service: "automation-tool" })

/**
 * Run AppleScript on macOS.
 */
async function runAppleScript(script: string): Promise<{ success: boolean; output?: string; error?: string }> {
  if (process.platform !== "darwin") {
    return { success: false, error: "AppleScript is only available on macOS" }
  }

  return new Promise((resolve) => {
    const proc = spawn("osascript", ["-e", script])
    let stdout = ""
    let stderr = ""

    proc.stdout?.on("data", (data) => {
      stdout += data.toString()
    })
    proc.stderr?.on("data", (data) => {
      stderr += data.toString()
    })

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout.trim() })
      } else {
        resolve({ success: false, error: stderr.trim() || `Exit code: ${code}` })
      }
    })

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message })
    })
  })
}

/**
 * Run PowerShell on Windows.
 */
async function runPowerShell(script: string): Promise<{ success: boolean; output?: string; error?: string }> {
  if (process.platform !== "win32") {
    return { success: false, error: "PowerShell is only available on Windows" }
  }

  return new Promise((resolve) => {
    const proc = spawn("powershell", ["-Command", script])
    let stdout = ""
    let stderr = ""

    proc.stdout?.on("data", (data) => {
      stdout += data.toString()
    })
    proc.stderr?.on("data", (data) => {
      stderr += data.toString()
    })

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout.trim() })
      } else {
        resolve({ success: false, error: stderr.trim() || `Exit code: ${code}` })
      }
    })

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message })
    })
  })
}

/**
 * Take a screenshot.
 */
async function takeScreenshot(
  outputPath: string,
  options: { region?: { x: number; y: number; width: number; height: number }; window?: string } = {}
): Promise<{ success: boolean; path?: string; error?: string }> {
  const platform = process.platform
  const filepath = path.isAbsolute(outputPath) ? outputPath : path.resolve(Instance.directory, outputPath)
  await fs.mkdir(path.dirname(filepath), { recursive: true })

  try {
    if (platform === "darwin") {
      const args = ["-x"] // No sound

      if (options.region) {
        const { x, y, width, height } = options.region
        args.push("-R", `${x},${y},${width},${height}`)
      } else if (options.window) {
        // Capture specific window by name
        const script = `tell application "System Events" to tell process "${options.window}" to set frontmost to true`
        await runAppleScript(script)
        args.push("-w") // Window mode
      }

      args.push(filepath)
      await execAsync(`screencapture ${args.join(" ")}`)
      return { success: true, path: filepath }
    } else if (platform === "win32") {
      // Use PowerShell to take screenshot
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
        $bitmap.Save("${filepath.replace(/\\/g, "\\\\")}")
      `
      await runPowerShell(script)
      return { success: true, path: filepath }
    } else {
      // Linux - use scrot or gnome-screenshot
      try {
        await execAsync(`scrot "${filepath}"`)
        return { success: true, path: filepath }
      } catch {
        await execAsync(`gnome-screenshot -f "${filepath}"`)
        return { success: true, path: filepath }
      }
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Get list of windows.
 */
async function listWindows(): Promise<{ success: boolean; windows?: Array<{ name: string; id?: string; app?: string }>; error?: string }> {
  const platform = process.platform

  try {
    if (platform === "darwin") {
      const script = `
        set windowList to {}
        tell application "System Events"
          repeat with proc in (every process whose background only is false)
            set procName to name of proc
            repeat with win in (every window of proc)
              set winName to name of win
              set end of windowList to procName & ": " & winName
            end repeat
          end repeat
        end tell
        return windowList
      `
      const result = await runAppleScript(script)
      if (result.success && result.output) {
        const windows = result.output.split(", ").map((w) => {
          const [app, ...nameParts] = w.split(": ")
          return { app, name: nameParts.join(": ") }
        })
        return { success: true, windows }
      }
      return { success: false, error: result.error }
    } else if (platform === "win32") {
      const script = `Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object ProcessName, MainWindowTitle | ConvertTo-Json`
      const result = await runPowerShell(script)
      if (result.success && result.output) {
        const data = JSON.parse(result.output)
        const windows = (Array.isArray(data) ? data : [data]).map((p: any) => ({
          app: p.ProcessName,
          name: p.MainWindowTitle,
        }))
        return { success: true, windows }
      }
      return { success: false, error: result.error }
    } else {
      // Linux - use wmctrl
      const { stdout } = await execAsync("wmctrl -l")
      const windows = stdout.split("\n").filter(Boolean).map((line) => {
        const parts = line.split(/\s+/)
        return { id: parts[0], name: parts.slice(3).join(" ") }
      })
      return { success: true, windows }
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Focus a window.
 */
async function focusWindow(windowName: string): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform

  try {
    if (platform === "darwin") {
      // Try to focus by app name first
      let script = `
        tell application "${windowName}"
          activate
        end tell
      `
      let result = await runAppleScript(script)
      if (!result.success) {
        // Try to find window by title
        script = `
          tell application "System Events"
            set targetWindow to first window of (first process whose name contains "${windowName}")
            perform action "AXRaise" of targetWindow
          end tell
        `
        result = await runAppleScript(script)
      }
      return result
    } else if (platform === "win32") {
      const script = `
        $process = Get-Process | Where-Object {$_.MainWindowTitle -like "*${windowName}*"} | Select-Object -First 1
        if ($process) {
          $hwnd = $process.MainWindowHandle
          [void][System.Reflection.Assembly]::LoadWithPartialName("Microsoft.VisualBasic")
          [Microsoft.VisualBasic.Interaction]::AppActivate($process.Id)
        }
      `
      return await runPowerShell(script)
    } else {
      await execAsync(`wmctrl -a "${windowName}"`)
      return { success: true }
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Simulate keyboard input.
 */
async function typeText(text: string, delay: number = 50): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform

  try {
    if (platform === "darwin") {
      // Escape special characters for AppleScript
      const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
      const script = `
        tell application "System Events"
          keystroke "${escaped}"
        end tell
      `
      return await runAppleScript(script)
    } else if (platform === "win32") {
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait("${text.replace(/[+^%~(){}[\]]/g, "{$&}")}")
      `
      return await runPowerShell(script)
    } else {
      await execAsync(`xdotool type --delay ${delay} "${text}"`)
      return { success: true }
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Simulate keyboard shortcut.
 */
async function sendHotkey(keys: string[]): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform

  // Map common key names to platform-specific names
  const keyMap: Record<string, Record<string, string>> = {
    darwin: {
      cmd: "command",
      ctrl: "control",
      alt: "option",
      shift: "shift",
      enter: "return",
      esc: "escape",
      tab: "tab",
      space: "space",
      backspace: "delete",
      delete: "forward delete",
      up: "up arrow",
      down: "down arrow",
      left: "left arrow",
      right: "right arrow",
    },
    win32: {
      cmd: "^", // Ctrl on Windows
      ctrl: "^",
      alt: "%",
      shift: "+",
      enter: "{ENTER}",
      esc: "{ESC}",
      tab: "{TAB}",
      space: " ",
      backspace: "{BACKSPACE}",
      delete: "{DELETE}",
      up: "{UP}",
      down: "{DOWN}",
      left: "{LEFT}",
      right: "{RIGHT}",
    },
    linux: {
      cmd: "super",
      ctrl: "ctrl",
      alt: "alt",
      shift: "shift",
      enter: "Return",
      esc: "Escape",
      tab: "Tab",
      space: "space",
      backspace: "BackSpace",
      delete: "Delete",
      up: "Up",
      down: "Down",
      left: "Left",
      right: "Right",
    },
  }

  try {
    if (platform === "darwin") {
      const modifiers = keys.slice(0, -1).map((k) => keyMap.darwin[k.toLowerCase()] || k)
      const key = keys[keys.length - 1]
      const modStr = modifiers.map((m) => `${m} down`).join(", ")

      const script = `
        tell application "System Events"
          keystroke "${key}" using {${modStr}}
        end tell
      `
      return await runAppleScript(script)
    } else if (platform === "win32") {
      let hotkey = ""
      for (const key of keys) {
        const mapped = keyMap.win32[key.toLowerCase()]
        if (mapped && mapped.length === 1) {
          hotkey += mapped
        } else if (mapped) {
          hotkey += mapped
        } else {
          hotkey += key.toLowerCase()
        }
      }

      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.SendKeys]::SendWait("${hotkey}")
      `
      return await runPowerShell(script)
    } else {
      const mappedKeys = keys.map((k) => keyMap.linux[k.toLowerCase()] || k)
      await execAsync(`xdotool key ${mappedKeys.join("+")}`)
      return { success: true }
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Click at coordinates.
 */
async function clickAt(x: number, y: number, options: { button?: "left" | "right" | "middle"; clicks?: number } = {}): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform
  const button = options.button || "left"
  const clicks = options.clicks || 1

  try {
    if (platform === "darwin") {
      // Use cliclick if available, otherwise AppleScript
      try {
        const clickType = button === "right" ? "rc" : button === "middle" ? "mc" : "c"
        await execAsync(`cliclick ${clickType}:${x},${y}`)
        return { success: true }
      } catch {
        // Fallback to AppleScript (limited functionality)
        const script = `
          tell application "System Events"
            click at {${x}, ${y}}
          end tell
        `
        return await runAppleScript(script)
      }
    } else if (platform === "win32") {
      const buttonNum = button === "right" ? 2 : button === "middle" ? 4 : 1
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
        $sig = '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int data, int info);'
        $mouse = Add-Type -MemberDefinition $sig -Name "Mouse" -Namespace "Win32" -PassThru
        $mouse::mouse_event(${buttonNum * 2}, 0, 0, 0, 0)
        $mouse::mouse_event(${buttonNum * 4}, 0, 0, 0, 0)
      `
      return await runPowerShell(script)
    } else {
      const buttonNum = button === "right" ? 3 : button === "middle" ? 2 : 1
      await execAsync(`xdotool mousemove ${x} ${y} click --repeat ${clicks} ${buttonNum}`)
      return { success: true }
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Get clipboard content.
 */
async function getClipboard(): Promise<{ success: boolean; content?: string; error?: string }> {
  const platform = process.platform

  try {
    if (platform === "darwin") {
      const { stdout } = await execAsync("pbpaste")
      return { success: true, content: stdout }
    } else if (platform === "win32") {
      const script = `Get-Clipboard`
      const result = await runPowerShell(script)
      return { success: result.success, content: result.output, error: result.error }
    } else {
      const { stdout } = await execAsync("xclip -selection clipboard -o")
      return { success: true, content: stdout }
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Set clipboard content.
 * Uses stdin piping to avoid shell injection vulnerabilities.
 */
async function setClipboard(content: string): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform

  try {
    if (platform === "darwin") {
      // Use spawn with stdin to avoid shell injection - content never touches shell
      return new Promise((resolve) => {
        const proc = spawn("pbcopy", [], { stdio: ["pipe", "pipe", "pipe"] })
        proc.stdin?.write(content)
        proc.stdin?.end()
        proc.on("close", (code) => {
          resolve({ success: code === 0 })
        })
        proc.on("error", (err) => {
          resolve({ success: false, error: err.message })
        })
      })
    } else if (platform === "win32") {
      // PowerShell: use -InputObject with properly escaped content
      // Escape single quotes by doubling them (PowerShell string escape)
      const escaped = content.replace(/'/g, "''")
      const script = `Set-Clipboard -Value '${escaped}'`
      return await runPowerShell(script)
    } else {
      // Linux: use spawn with stdin to avoid shell injection
      return new Promise((resolve) => {
        const proc = spawn("xclip", ["-selection", "clipboard"], { stdio: ["pipe", "pipe", "pipe"] })
        proc.stdin?.write(content)
        proc.stdin?.end()
        proc.on("close", (code) => {
          resolve({ success: code === 0 })
        })
        proc.on("error", (err) => {
          resolve({ success: false, error: err.message })
        })
      })
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export const AutomationTool = Tool.define("automation", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      action: z
        .enum([
          "screenshot",
          "windows",
          "focus",
          "type",
          "hotkey",
          "click",
          "clipboard_get",
          "clipboard_set",
          "applescript",
          "powershell",
        ])
        .describe("Automation action to perform"),

      // Screenshot
      path: z.string().optional().describe("Path to save screenshot"),
      region: z
        .object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        })
        .optional()
        .describe("Screen region for screenshot"),

      // Window
      windowName: z.string().optional().describe("Window or app name to focus"),

      // Type/Hotkey
      text: z.string().optional().describe("Text to type"),
      keys: z.array(z.string()).optional().describe("Keys for hotkey (e.g., ['cmd', 'shift', 'p'])"),
      delay: z.number().optional().describe("Delay between keystrokes in ms"),

      // Click
      x: z.number().optional().describe("X coordinate for click"),
      y: z.number().optional().describe("Y coordinate for click"),
      button: z.enum(["left", "right", "middle"]).optional().describe("Mouse button"),
      clicks: z.number().optional().describe("Number of clicks"),

      // Clipboard
      content: z.string().optional().describe("Content to set in clipboard"),

      // Script
      script: z.string().optional().describe("AppleScript or PowerShell script to execute"),
    }),
    async execute(params, ctx) {
      // Request permission
      const permissionType = params.action === "applescript" || params.action === "powershell"
        ? "automation_script"
        : "automation"

      await ctx.ask({
        permission: permissionType,
        patterns: [params.action],
        always: [params.action],
        metadata: {},
      })

      switch (params.action) {
        case "screenshot": {
          const outputPath = params.path || `screenshots/screenshot-${Date.now()}.png`
          const result = await takeScreenshot(outputPath, { region: params.region })

          if (!result.success) {
            throw new Error(`Failed to capture screenshot: ${result.error}`)
          }
          return {
            title: "Screenshot captured",
            metadata: {},
            output: `Screenshot saved to: ${result.path}`,
          }
        }

        case "windows": {
          const result = await listWindows()

          if (!result.success || !result.windows) {
            throw new Error(`Failed to list windows: ${result.error}`)
          }
          const output = result.windows
            .map((w) => `${w.app ? `[${w.app}] ` : ""}${w.name}`)
            .join("\n")

          return {
            title: `${result.windows.length} windows`,
            metadata: {},
            output: output || "(no windows found)",
          }
        }

        case "focus": {
          if (!params.windowName) {
            throw new Error("Window name is required for focus action")
          }

          const result = await focusWindow(params.windowName)

          if (!result.success) {
            throw new Error(`Failed to focus window: ${result.error}`)
          }
          return {
            title: `Focused: ${params.windowName}`,
            metadata: {},
            output: `Focused window: ${params.windowName}`,
          }
        }

        case "type": {
          if (!params.text) {
            throw new Error("Text is required for type action")
          }

          const result = await typeText(params.text, params.delay)

          if (!result.success) {
            throw new Error(`Failed to type text: ${result.error}`)
          }
          return {
            title: "Text typed",
            metadata: {},
            output: `Typed ${params.text.length} characters`,
          }
        }

        case "hotkey": {
          if (!params.keys || params.keys.length === 0) {
            throw new Error("Keys array is required for hotkey action")
          }

          const result = await sendHotkey(params.keys)

          if (!result.success) {
            throw new Error(`Failed to send hotkey: ${result.error}`)
          }
          return {
            title: `Hotkey: ${params.keys.join("+")}`,
            metadata: {},
            output: `Sent hotkey: ${params.keys.join("+")}`,
          }
        }

        case "click": {
          if (params.x === undefined || params.y === undefined) {
            throw new Error("X and Y coordinates are required for click action")
          }

          const result = await clickAt(params.x, params.y, {
            button: params.button,
            clicks: params.clicks,
          })

          if (!result.success) {
            throw new Error(`Failed to click: ${result.error}`)
          }
          return {
            title: `Clicked at (${params.x}, ${params.y})`,
            metadata: {},
            output: `Clicked at coordinates (${params.x}, ${params.y})`,
          }
        }

        case "clipboard_get": {
          const result = await getClipboard()

          if (!result.success) {
            throw new Error(`Failed to get clipboard: ${result.error}`)
          }
          return {
            title: "Clipboard content",
            metadata: {},
            output: result.content || "(empty)",
          }
        }

        case "clipboard_set": {
          if (!params.content) {
            throw new Error("Content is required for clipboard_set action")
          }

          const result = await setClipboard(params.content)

          if (!result.success) {
            throw new Error(`Failed to set clipboard: ${result.error}`)
          }
          return {
            title: "Clipboard set",
            metadata: {},
            output: `Set clipboard content (${params.content.length} characters)`,
          }
        }

        case "applescript": {
          if (!params.script) {
            throw new Error("Script is required for applescript action")
          }

          const result = await runAppleScript(params.script)

          if (!result.success) {
            throw new Error(`AppleScript error: ${result.error}`)
          }
          return {
            title: "AppleScript executed",
            metadata: {},
            output: result.output || "(no output)",
          }
        }

        case "powershell": {
          if (!params.script) {
            throw new Error("Script is required for powershell action")
          }

          const result = await runPowerShell(params.script)

          if (!result.success) {
            throw new Error(`PowerShell error: ${result.error}`)
          }
          return {
            title: "PowerShell executed",
            metadata: {},
            output: result.output || "(no output)",
          }
        }

        default:
          throw new Error(`Unknown action: ${params.action}`)
      }
    },
  }
})
