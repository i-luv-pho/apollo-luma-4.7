import { cmd } from "./cmd"
import { UI } from "../ui"
import * as prompts from "@clack/prompts"
import { createHash } from "crypto"
import path from "path"
import fs from "fs"
import os from "os"

const SECRET_SALT = "apollo-metamorphosis-2025"
const LICENSE_PATH = path.join(os.homedir(), ".apollo", "license.json")

interface License {
  decks_remaining: number
  activated_at: string
  expires_at: string
  code: string
}

function validateCode(code: string): { valid: boolean; decks?: number; error?: string } {
  // Format: APOLLO-{RANDOM}-{DECKS}-{CHECKSUM}
  const match = code.match(/^APOLLO-([A-Z0-9]{6})-(\d+)-([a-f0-9]{4})$/)

  if (!match) {
    return { valid: false, error: "Invalid code format" }
  }

  const [, random, decksStr, checksum] = match
  const decks = parseInt(decksStr, 10)

  // Recalculate checksum
  const expectedChecksum = createHash("sha256")
    .update(random + decks + SECRET_SALT)
    .digest("hex")
    .slice(0, 4)

  if (checksum !== expectedChecksum) {
    return { valid: false, error: "Invalid code" }
  }

  return { valid: true, decks }
}

export function getLicense(): License | null {
  try {
    if (fs.existsSync(LICENSE_PATH)) {
      const license = JSON.parse(fs.readFileSync(LICENSE_PATH, "utf-8")) as License
      // Check if expired
      if (new Date(license.expires_at) < new Date()) {
        return null
      }
      return license
    }
  } catch {}
  return null
}

export function getLicenseRaw(): License | null {
  try {
    if (fs.existsSync(LICENSE_PATH)) {
      return JSON.parse(fs.readFileSync(LICENSE_PATH, "utf-8"))
    }
  } catch {}
  return null
}

export function isExpired(): boolean {
  const license = getLicenseRaw()
  if (!license) return true
  return new Date(license.expires_at) < new Date()
}

export function saveLicense(license: License): void {
  const dir = path.dirname(LICENSE_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(LICENSE_PATH, JSON.stringify(license, null, 2))
}

export function decrementDecks(): boolean {
  const license = getLicense()
  if (!license || license.decks_remaining <= 0) {
    return false
  }
  license.decks_remaining--
  saveLicense(license)
  return true
}

export const ActivateCommand = cmd({
  command: "activate <code>",
  describe: "Activate a license code",
  builder: (yargs) =>
    yargs.positional("code", {
      describe: "Activation code (e.g., APOLLO-XXXX-10-XXXX)",
      type: "string",
      demandOption: true,
    }),
  async handler(args) {
    UI.empty()
    prompts.intro("Activate License")

    const code = args.code.toUpperCase()
    const result = validateCode(code)

    if (!result.valid) {
      prompts.log.error(result.error || "Invalid code")
      prompts.outro("Activation failed")
      process.exit(1)
    }

    // Check if already activated with same code
    const existing = getLicense()
    if (existing && existing.code === code) {
      prompts.log.info(`Already activated! ${existing.decks_remaining} decks remaining.`)
      prompts.outro("Done")
      return
    }

    // Save new license (expires in 1 month)
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const license: License = {
      decks_remaining: result.decks!,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      code,
    }
    saveLicense(license)

    const expiresFormatted = expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    prompts.log.success(`Activated! ${result.decks} decks available until ${expiresFormatted}.`)
    prompts.outro("Done")
  },
})
