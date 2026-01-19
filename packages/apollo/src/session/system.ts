import { Ripgrep } from "../file/ripgrep"
import { Global } from "../global"
import { Filesystem } from "../util/filesystem"
import { Config } from "../config/config"

import { Instance } from "../project/instance"
import path from "path"
import os from "os"

import PROMPT_ANTHROPIC from "./prompt/anthropic.txt"
import PROMPT_ANTHROPIC_WITHOUT_TODO from "./prompt/qwen.txt"
import PROMPT_BEAST from "./prompt/beast.txt"
import PROMPT_GEMINI from "./prompt/gemini.txt"
import PROMPT_ANTHROPIC_SPOOF from "./prompt/anthropic_spoof.txt"

import PROMPT_CODEX from "./prompt/codex.txt"
import PROMPT_CODEX_INSTRUCTIONS from "./prompt/codex_header.txt"
import type { Provider } from "@/provider/provider"
import { Flag } from "@/flag/flag"

export namespace SystemPrompt {
  export function header(providerID: string) {
    if (providerID.includes("anthropic")) return [PROMPT_ANTHROPIC_SPOOF.trim()]
    return []
  }

  export function instructions() {
    return PROMPT_CODEX_INSTRUCTIONS.trim()
  }

  export function provider(model: Provider.Model) {
    if (model.api.id.includes("gpt-5")) return [PROMPT_CODEX]
    if (model.api.id.includes("gpt-") || model.api.id.includes("o1") || model.api.id.includes("o3"))
      return [PROMPT_BEAST]
    if (model.api.id.includes("gemini-")) return [PROMPT_GEMINI]
    if (model.api.id.includes("claude")) return [PROMPT_ANTHROPIC]
    return [PROMPT_ANTHROPIC_WITHOUT_TODO]
  }

  export async function environment() {
    const project = Instance.project
    return [
      [
        `Here is some useful information about the environment you are running in:`,
        `<env>`,
        `  Working directory: ${Instance.directory}`,
        `  Is directory a git repo: ${project.vcs === "git" ? "yes" : "no"}`,
        `  Platform: ${process.platform}`,
        `  Today's date: ${new Date().toDateString()}`,
        `</env>`,
        `<files>`,
        `  ${
          project.vcs === "git"
            ? await Ripgrep.tree({
                cwd: Instance.directory,
                limit: 200,
              })
            : ""
        }`,
        `</files>`,
      ].join("\n"),
    ]
  }

  // Local rule files (searched with findUp from project directory)
  const LOCAL_RULE_FILES = [
    "APOLLO.md",
    "AGENTS.md",
    "CONTEXT.md", // deprecated
  ]

  // Global rule files (personal memory across all projects)
  const GLOBAL_RULE_FILES = [
    path.join(os.homedir(), ".apollo", "APOLLO.md"),
    path.join(os.homedir(), ".apollo", "AGENTS.md"),
    path.join(Global.Path.config, "AGENTS.md"),
  ]

  if (Flag.APOLLO_CONFIG_DIR) {
    GLOBAL_RULE_FILES.push(path.join(Flag.APOLLO_CONFIG_DIR, "AGENTS.md"))
    GLOBAL_RULE_FILES.push(path.join(Flag.APOLLO_CONFIG_DIR, "APOLLO.md"))
  }

  // Parse @import syntax from memory files
  async function parseImports(content: string, basePath: string): Promise<string> {
    const lines = content.split("\n")
    const result: string[] = []

    for (const line of lines) {
      // Match @path/to/file or @./relative/path
      const importMatch = line.match(/^@(.+)$/)
      if (importMatch) {
        const importPath = importMatch[1].trim()
        let fullPath: string

        if (importPath.startsWith("~/")) {
          fullPath = path.join(os.homedir(), importPath.slice(2))
        } else if (path.isAbsolute(importPath)) {
          fullPath = importPath
        } else {
          fullPath = path.join(path.dirname(basePath), importPath)
        }

        try {
          const importedContent = await Bun.file(fullPath).text()
          // Recursively parse imports in imported files
          const parsed = await parseImports(importedContent, fullPath)
          result.push(`<!-- Imported from: ${importPath} -->`)
          result.push(parsed)
          result.push(`<!-- End import: ${importPath} -->`)
        } catch {
          result.push(`<!-- Failed to import: ${importPath} -->`)
        }
      } else {
        result.push(line)
      }
    }

    return result.join("\n")
  }

  // Load memory file with import parsing
  async function loadMemoryFile(filePath: string): Promise<string> {
    try {
      const content = await Bun.file(filePath).text()
      const parsed = await parseImports(content, filePath)
      return "Instructions from: " + filePath + "\n" + parsed
    } catch {
      return ""
    }
  }

  // Load rules from .apollo/rules/ directory
  async function loadRulesDirectory(baseDir: string): Promise<string[]> {
    const results: string[] = []
    const rulesDirs = [
      path.join(baseDir, ".apollo", "rules"),
    ]

    for (const rulesDir of rulesDirs) {
      try {
        const glob = new Bun.Glob("**/*.md")
        const files = await Array.fromAsync(
          glob.scan({ cwd: rulesDir, absolute: true, onlyFiles: true })
        )

        for (const file of files) {
          const content = await loadMemoryFile(file)
          if (content) results.push(content)
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }

    return results
  }

  // Load local memory files (.apollo/APOLLO.local.md)
  async function loadLocalMemory(baseDir: string): Promise<string[]> {
    const results: string[] = []
    const localFiles = [
      path.join(baseDir, ".apollo", "APOLLO.local.md"),
    ]

    for (const localFile of localFiles) {
      const content = await loadMemoryFile(localFile)
      if (content) results.push(content)
    }

    return results
  }

  export async function custom() {
    const config = await Config.get()
    const paths = new Set<string>()

    for (const localRuleFile of LOCAL_RULE_FILES) {
      const matches = await Filesystem.findUp(localRuleFile, Instance.directory, Instance.worktree)
      if (matches.length > 0) {
        matches.forEach((path) => paths.add(path))
        break
      }
    }

    for (const globalRuleFile of GLOBAL_RULE_FILES) {
      if (await Bun.file(globalRuleFile).exists()) {
        paths.add(globalRuleFile)
        break
      }
    }

    const urls: string[] = []
    if (config.instructions) {
      for (let instruction of config.instructions) {
        if (instruction.startsWith("https://") || instruction.startsWith("http://")) {
          urls.push(instruction)
          continue
        }
        if (instruction.startsWith("~/")) {
          instruction = path.join(os.homedir(), instruction.slice(2))
        }
        let matches: string[] = []
        if (path.isAbsolute(instruction)) {
          matches = await Array.fromAsync(
            new Bun.Glob(path.basename(instruction)).scan({
              cwd: path.dirname(instruction),
              absolute: true,
              onlyFiles: true,
            }),
          ).catch(() => [])
        } else {
          matches = await Filesystem.globUp(instruction, Instance.directory, Instance.worktree).catch(() => [])
        }
        matches.forEach((path) => paths.add(path))
      }
    }

    const foundFiles = Array.from(paths).map((p) =>
      Bun.file(p)
        .text()
        .catch(() => "")
        .then((x) => "Instructions from: " + p + "\n" + x),
    )
    const foundUrls = urls.map((url) =>
      fetch(url, { signal: AbortSignal.timeout(5000) })
        .then((res) => (res.ok ? res.text() : ""))
        .catch(() => "")
        .then((x) => (x ? "Instructions from: " + url + "\n" + x : "")),
    )
    return Promise.all([...foundFiles, ...foundUrls]).then((result) => result.filter(Boolean))
  }
}
