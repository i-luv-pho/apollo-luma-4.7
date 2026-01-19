import { cmd } from "./cmd"
import { UI } from "../ui"
import path from "path"
import fs from "fs"
import { validateAccessKey } from "@/deck/supabase"

const CONFIG_DIR = path.join(process.env.HOME || "~", ".apollo")
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json")

export const LoginCommand = cmd({
  command: "login",
  describe: "Login with your access key",
  builder: (yargs) => yargs,
  handler: async () => {
    const readline = await import("readline")
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    UI.println()
    UI.println(UI.Style.TEXT_HIGHLIGHT_BOLD + "Apollo Login" + UI.Style.TEXT_NORMAL)
    UI.println()

    const accessKey = await new Promise<string>((resolve) => {
      rl.question("Paste your access key: ", (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    })

    if (!accessKey) {
      UI.error("No access key provided")
      process.exit(1)
    }

    // Validate
    UI.println(UI.Style.TEXT_DIM + "Validating..." + UI.Style.TEXT_NORMAL)
    const validation = await validateAccessKey(accessKey)

    if (!validation.valid) {
      UI.error(validation.error || "Invalid access key")
      process.exit(1)
    }

    // Save
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true })
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({
      accessKey,
      accessKeySetAt: Date.now(),
    }, null, 2))

    UI.println()
    UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓ Logged in!" + UI.Style.TEXT_NORMAL)
    UI.println(UI.Style.TEXT_DIM + `  ${validation.data!.decks_used}/${validation.data!.decks_limit} decks used` + UI.Style.TEXT_NORMAL)
    UI.println()
  },
})

export const LogoutCommand = cmd({
  command: "logout",
  describe: "Logout and remove saved access key",
  builder: (yargs) => yargs,
  handler: async () => {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE)
      UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓ Logged out" + UI.Style.TEXT_NORMAL)
    } else {
      UI.println(UI.Style.TEXT_DIM + "Already logged out" + UI.Style.TEXT_NORMAL)
    }
  },
})
