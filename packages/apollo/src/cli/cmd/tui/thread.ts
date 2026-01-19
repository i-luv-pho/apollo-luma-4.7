import { cmd } from "@/cli/cmd/cmd"
import { tui } from "./app"
import { Rpc } from "@/util/rpc"
import { type rpc } from "./worker"
import path from "path"
import fs from "fs"
import { UI } from "@/cli/ui"
import { iife } from "@/util/iife"
import { Log } from "@/util/log"
import { withNetworkOptions, resolveNetworkOptions } from "@/cli/network"
import type { Event } from "@apollo-ai/sdk/v2"
import type { EventSource } from "./context/sdk"
import { validateApiKey } from "@/deck/supabase"

// API key storage
const CONFIG_DIR = path.join(process.env.HOME || "~", ".apollo")
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json")
const KEY_EXPIRY_DAYS = 30

interface Config {
  apiKey?: string
  apiKeySetAt?: number
}

function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
    }
  } catch {}
  return {}
}

function saveConfig(config: Config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

function isKeyExpired(setAt: number): boolean {
  const expiryMs = KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  return Date.now() - setAt > expiryMs
}

async function promptForKey(): Promise<string> {
  const readline = await import("readline")
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question("Paste your API key: ", (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

declare global {
  const APOLLO_WORKER_PATH: string
}

type RpcClient = ReturnType<typeof Rpc.client<typeof rpc>>

function createWorkerFetch(client: RpcClient): typeof fetch {
  const fn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init)
    const body = request.body ? await request.text() : undefined
    const result = await client.call("fetch", {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
    })
    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    })
  }
  return fn as typeof fetch
}

function createEventSource(client: RpcClient): EventSource {
  return {
    on: (handler) => client.on<Event>("event", handler),
  }
}

export const TuiThreadCommand = cmd({
  command: "$0 [project]",
  describe: "start apollo tui",
  builder: (yargs) =>
    withNetworkOptions(yargs)
      .positional("project", {
        type: "string",
        describe: "path to start apollo in",
      })
      .option("model", {
        type: "string",
        alias: ["m"],
        describe: "model to use in the format of provider/model",
      })
      .option("continue", {
        alias: ["c"],
        describe: "continue the last session",
        type: "boolean",
      })
      .option("session", {
        alias: ["s"],
        type: "string",
        describe: "session id to continue",
      })
      .option("prompt", {
        type: "string",
        describe: "prompt to use",
      })
      .option("agent", {
        type: "string",
        describe: "agent to use",
      }),
  handler: async (args) => {
    // Get API key - check env, then saved config, then prompt
    let apiKey = process.env.APOLLO_API_KEY
    const config = loadConfig()

    // Check saved key
    if (!apiKey && config.apiKey && config.apiKeySetAt) {
      if (isKeyExpired(config.apiKeySetAt)) {
        UI.println(UI.Style.TEXT_DIM + "API key expired. Please enter a new one." + UI.Style.TEXT_NORMAL)
        UI.println()
      } else {
        apiKey = config.apiKey
      }
    }

    // Prompt for key if needed
    if (!apiKey) {
      UI.println()
      UI.println(UI.Style.TEXT_HIGHLIGHT_BOLD + "First time setup" + UI.Style.TEXT_NORMAL)
      UI.println()
      apiKey = await promptForKey()

      if (!apiKey) {
        UI.error("No API key provided")
        process.exit(1)
      }
    }

    // Validate API key
    const validation = await validateApiKey(apiKey)
    if (!validation.valid) {
      UI.error(validation.error || "Invalid API key")
      process.exit(1)
    }

    // Save valid key for 30 days
    if (apiKey !== config.apiKey) {
      saveConfig({ apiKey, apiKeySetAt: Date.now() })
    }

    UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + ` API key valid (${validation.data!.decks_used}/${validation.data!.decks_limit} decks used)`)
    UI.println()

    // Resolve relative paths against PWD to preserve behavior when using --cwd flag
    const baseCwd = process.env.PWD ?? process.cwd()
    const cwd = args.project ? path.resolve(baseCwd, args.project) : process.cwd()
    const localWorker = new URL("./worker.ts", import.meta.url)
    const distWorker = new URL("./cli/cmd/tui/worker.js", import.meta.url)
    const workerPath = await iife(async () => {
      if (typeof APOLLO_WORKER_PATH !== "undefined") return APOLLO_WORKER_PATH
      if (await Bun.file(distWorker).exists()) return distWorker
      return localWorker
    })
    try {
      process.chdir(cwd)
    } catch (e) {
      UI.error("Failed to change directory to " + cwd)
      return
    }

    const worker = new Worker(workerPath, {
      env: Object.fromEntries(
        Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
      ),
    })
    worker.onerror = (e) => {
      Log.Default.error(e)
    }
    const client = Rpc.client<typeof rpc>(worker)
    process.on("uncaughtException", (e) => {
      Log.Default.error(e)
    })
    process.on("unhandledRejection", (e) => {
      Log.Default.error(e)
    })
    process.on("SIGUSR2", async () => {
      await client.call("reload", undefined)
    })

    const prompt = await iife(async () => {
      const piped = !process.stdin.isTTY ? await Bun.stdin.text() : undefined
      if (!args.prompt) return piped
      return piped ? piped + "\n" + args.prompt : args.prompt
    })

    // Check if server should be started (port or hostname explicitly set in CLI or config)
    const networkOpts = await resolveNetworkOptions(args)
    const shouldStartServer =
      process.argv.includes("--port") ||
      process.argv.includes("--hostname") ||
      process.argv.includes("--mdns") ||
      networkOpts.mdns ||
      networkOpts.port !== 0 ||
      networkOpts.hostname !== "127.0.0.1"

    let url: string
    let customFetch: typeof fetch | undefined
    let events: EventSource | undefined

    if (shouldStartServer) {
      // Start HTTP server for external access
      const server = await client.call("server", networkOpts)
      url = server.url
    } else {
      // Use direct RPC communication (no HTTP)
      url = "http://apollo.internal"
      customFetch = createWorkerFetch(client)
      events = createEventSource(client)
    }

    const tuiPromise = tui({
      url,
      fetch: customFetch,
      events,
      args: {
        continue: args.continue,
        sessionID: args.session,
        agent: args.agent,
        model: args.model,
        prompt,
      },
      onExit: async () => {
        await client.call("shutdown", undefined)
      },
    })

    setTimeout(() => {
      client.call("checkUpgrade", { directory: cwd }).catch(() => {})
    }, 1000)

    await tuiPromise
  },
})
