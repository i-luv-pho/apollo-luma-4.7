import z from "zod"
import { Tool } from "./tool"
import { spawn, exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"
import DESCRIPTION from "./open.txt"
import { Log } from "../util/log"
import { Instance } from "../project/instance"

const execAsync = promisify(exec)
const log = Log.create({ service: "open-tool" })

/**
 * Platform-specific application mappings.
 * Maps friendly names to bundle IDs (macOS), executable paths (Windows), or commands (Linux).
 */
const APP_ALIASES: Record<string, Record<string, string>> = {
  darwin: {
    "visual studio code": "com.microsoft.VSCode",
    vscode: "com.microsoft.VSCode",
    code: "com.microsoft.VSCode",
    chrome: "com.google.Chrome",
    "google chrome": "com.google.Chrome",
    firefox: "org.mozilla.firefox",
    safari: "com.apple.Safari",
    finder: "com.apple.finder",
    terminal: "com.apple.Terminal",
    iterm: "com.googlecode.iterm2",
    iterm2: "com.googlecode.iterm2",
    sublime: "com.sublimetext.4",
    "sublime text": "com.sublimetext.4",
    atom: "com.github.atom",
    webstorm: "com.jetbrains.WebStorm",
    intellij: "com.jetbrains.intellij",
    "intellij idea": "com.jetbrains.intellij",
    pycharm: "com.jetbrains.pycharm",
    slack: "com.tinyspeck.slackmacgap",
    discord: "com.hnc.Discord",
    spotify: "com.spotify.client",
    preview: "com.apple.Preview",
    textedit: "com.apple.TextEdit",
    notes: "com.apple.Notes",
    pages: "com.apple.iWork.Pages",
    numbers: "com.apple.iWork.Numbers",
    keynote: "com.apple.iWork.Keynote",
    xcode: "com.apple.dt.Xcode",
    "microsoft word": "com.microsoft.Word",
    word: "com.microsoft.Word",
    "microsoft excel": "com.microsoft.Excel",
    excel: "com.microsoft.Excel",
    "microsoft powerpoint": "com.microsoft.Powerpoint",
    powerpoint: "com.microsoft.Powerpoint",
    figma: "com.figma.Desktop",
    sketch: "com.bohemiancoding.sketch3",
    photoshop: "com.adobe.Photoshop",
    illustrator: "com.adobe.Illustrator",
    cursor: "com.todesktop.230313mzl4w4u92",
    zed: "dev.zed.Zed",
  },
  win32: {
    "visual studio code": "code",
    vscode: "code",
    code: "code",
    chrome: "chrome",
    "google chrome": "chrome",
    firefox: "firefox",
    edge: "msedge",
    "microsoft edge": "msedge",
    notepad: "notepad",
    "notepad++": "notepad++",
    explorer: "explorer",
    cmd: "cmd",
    powershell: "powershell",
    "windows terminal": "wt",
    sublime: "subl",
    "sublime text": "subl",
    word: "winword",
    "microsoft word": "winword",
    excel: "excel",
    "microsoft excel": "excel",
    powerpoint: "powerpnt",
    "microsoft powerpoint": "powerpnt",
    cursor: "cursor",
  },
  linux: {
    "visual studio code": "code",
    vscode: "code",
    code: "code",
    chrome: "google-chrome",
    "google chrome": "google-chrome",
    chromium: "chromium",
    firefox: "firefox",
    nautilus: "nautilus",
    "file manager": "nautilus",
    terminal: "gnome-terminal",
    "gnome terminal": "gnome-terminal",
    konsole: "konsole",
    sublime: "subl",
    "sublime text": "subl",
    gedit: "gedit",
    kate: "kate",
    dolphin: "dolphin",
    cursor: "cursor",
    zed: "zed",
  },
}

/**
 * Check if a string is a URL.
 */
function isUrl(target: string): boolean {
  try {
    const url = new URL(target)
    return ["http:", "https:", "file:", "mailto:", "tel:"].includes(url.protocol)
  } catch {
    // Also check for common URL patterns without protocol
    return /^(www\.|localhost[:/]|[\w-]+\.(com|org|net|io|dev|app|co|me|ai|xyz)\b)/i.test(target)
  }
}

/**
 * Normalize URL by adding protocol if missing.
 */
function normalizeUrl(target: string): string {
  if (/^https?:\/\//i.test(target)) {
    return target
  }
  if (/^(mailto:|tel:|file:)/i.test(target)) {
    return target
  }
  if (/^localhost[:/]/i.test(target)) {
    return `http://${target}`
  }
  return `https://${target}`
}

/**
 * Resolve application name to platform-specific identifier.
 */
function resolveApp(app: string): string | undefined {
  const platform = process.platform as keyof typeof APP_ALIASES
  const aliases = APP_ALIASES[platform] || {}
  const normalizedApp = app.toLowerCase().trim()
  return aliases[normalizedApp] || app
}

/**
 * Open a target using the platform-specific command.
 */
async function openTarget(
  target: string,
  options: {
    app?: string
    wait?: boolean
    background?: boolean
    newInstance?: boolean
  } = {}
): Promise<{ success: boolean; message: string }> {
  const platform = process.platform
  const app = options.app ? resolveApp(options.app) : undefined

  try {
    if (platform === "darwin") {
      return await openMacOS(target, { ...options, app })
    } else if (platform === "win32") {
      return await openWindows(target, { ...options, app })
    } else {
      return await openLinux(target, { ...options, app })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, message: `Failed to open: ${message}` }
  }
}

/**
 * Open on macOS using the `open` command.
 */
async function openMacOS(
  target: string,
  options: { app?: string; wait?: boolean; background?: boolean; newInstance?: boolean }
): Promise<{ success: boolean; message: string }> {
  const args: string[] = []

  if (options.app) {
    // Check if it's a bundle ID or app name
    if (options.app.includes(".")) {
      args.push("-b", options.app)
    } else {
      args.push("-a", options.app)
    }
  }

  if (options.wait) {
    args.push("-W")
  }

  if (options.background) {
    args.push("-g")
  }

  if (options.newInstance) {
    args.push("-n")
  }

  args.push(target)

  log.info("macOS open", { args })

  return new Promise((resolve) => {
    const proc = spawn("open", args, {
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stderr = ""
    proc.stderr?.on("data", (data) => {
      stderr += data.toString()
    })

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, message: `Opened ${target}` })
      } else {
        resolve({ success: false, message: stderr.trim() || `Exit code: ${code}` })
      }
    })

    proc.on("error", (err) => {
      resolve({ success: false, message: err.message })
    })
  })
}

/**
 * Open on Windows using the `start` command.
 */
async function openWindows(
  target: string,
  options: { app?: string; wait?: boolean; background?: boolean }
): Promise<{ success: boolean; message: string }> {
  try {
    let command: string

    if (options.app) {
      // Use PowerShell Start-Process for more control
      const waitFlag = options.wait ? "-Wait" : ""
      const windowStyle = options.background ? "-WindowStyle Hidden" : ""
      command = `powershell -Command "Start-Process '${options.app}' -ArgumentList '${target}' ${waitFlag} ${windowStyle}"`
    } else {
      // Use start command for default application
      const waitFlag = options.wait ? "/wait" : ""
      // Empty title required for paths with spaces
      command = `start "" ${waitFlag} "${target}"`
    }

    log.info("Windows open", { command })

    await execAsync(command)
    return { success: true, message: `Opened ${target}` }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, message }
  }
}

/**
 * Open on Linux using xdg-open or specified application.
 */
async function openLinux(
  target: string,
  options: { app?: string; wait?: boolean; background?: boolean }
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    let command: string
    let args: string[]

    if (options.app) {
      command = options.app
      args = [target]
    } else {
      command = "xdg-open"
      args = [target]
    }

    log.info("Linux open", { command, args })

    const proc = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: !options.wait && !options.background,
    })

    if (!options.wait && !options.background) {
      proc.unref()
      resolve({ success: true, message: `Opened ${target}` })
      return
    }

    let stderr = ""
    proc.stderr?.on("data", (data) => {
      stderr += data.toString()
    })

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, message: `Opened ${target}` })
      } else {
        resolve({ success: false, message: stderr.trim() || `Exit code: ${code}` })
      }
    })

    proc.on("error", (err) => {
      resolve({ success: false, message: err.message })
    })
  })
}

/**
 * List available applications on the system.
 */
async function listApps(): Promise<string[]> {
  const platform = process.platform

  try {
    if (platform === "darwin") {
      const { stdout } = await execAsync(
        'mdfind "kMDItemKind == Application" | head -50'
      )
      return stdout
        .split("\n")
        .filter(Boolean)
        .map((p) => path.basename(p, ".app"))
        .sort()
    } else if (platform === "win32") {
      const { stdout } = await execAsync(
        'powershell -Command "Get-StartApps | Select-Object -First 50 -ExpandProperty Name"'
      )
      return stdout.split("\n").filter(Boolean).sort()
    } else {
      // Linux - check common application directories
      const dirs = ["/usr/share/applications", `${process.env.HOME}/.local/share/applications`]
      const apps = new Set<string>()

      for (const dir of dirs) {
        try {
          const files = await fs.readdir(dir)
          for (const file of files) {
            if (file.endsWith(".desktop")) {
              apps.add(file.replace(".desktop", ""))
            }
          }
        } catch {
          // Directory doesn't exist or not readable
        }
      }

      return Array.from(apps).sort().slice(0, 50)
    }
  } catch {
    return []
  }
}

export const OpenTool = Tool.define("open", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      target: z
        .string()
        .describe("The file path or URL to open. Can be absolute or relative to current directory."),
      app: z
        .string()
        .optional()
        .describe(
          "Specific application to open the target with. Can use friendly names like 'Visual Studio Code', 'Chrome', etc."
        ),
      wait: z
        .boolean()
        .optional()
        .default(false)
        .describe("Wait for the application to close before returning. Useful for sequential workflows."),
      background: z
        .boolean()
        .optional()
        .default(false)
        .describe("Open without bringing the application to focus."),
      newInstance: z
        .boolean()
        .optional()
        .default(false)
        .describe("Open a new instance of the application even if one is already running. macOS only."),
    }),
    async execute(params, ctx) {
      let target = params.target

      // Detect if URL or file
      const isTargetUrl = isUrl(target)

      if (isTargetUrl) {
        // Normalize URL
        target = normalizeUrl(target)

        // Request permission for URL
        await ctx.ask({
          permission: "open_url",
          patterns: [target],
          always: [new URL(target).hostname + "/*"],
          metadata: {},
        })
      } else {
        // Resolve relative paths
        if (!path.isAbsolute(target)) {
          target = path.resolve(Instance.directory, target)
        }

        // Check if file exists
        try {
          await fs.access(target)
        } catch {
          throw new Error(`File not found: ${target}`)
        }

        // Request permission for file
        await ctx.ask({
          permission: "open_file",
          patterns: [target],
          always: [path.dirname(target) + "/*"],
          metadata: {},
        })
      }

      const result = await openTarget(target, {
        app: params.app,
        wait: params.wait,
        background: params.background,
        newInstance: params.newInstance,
      })

      if (!result.success) {
        throw new Error(result.message)
      }

      return {
        title: `Opened ${path.basename(target)}`,
        metadata: {},
        output: result.message,
      }
    },
  }
})
