import z from "zod"
import { Tool } from "./tool"
import path from "path"
import fs from "fs/promises"
import DESCRIPTION from "./browser.txt"
import { Log } from "../util/log"
import { Instance } from "../project/instance"
import { Bus } from "../bus"
import { Session } from "../session"

const log = Log.create({ service: "browser-tool" })

/**
 * Validate and resolve a file path, ensuring it stays within the project directory.
 * Prevents path traversal attacks.
 */
function resolveSafePath(filename: string, baseDir: string): string {
  // Reject absolute paths to prevent writing outside project
  if (path.isAbsolute(filename)) {
    throw new Error(`Absolute paths are not allowed for security reasons. Use a relative path instead.`)
  }

  // Resolve the path relative to base directory
  const resolved = path.resolve(baseDir, filename)

  // Ensure the resolved path is within the base directory
  const normalizedBase = path.resolve(baseDir)
  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    throw new Error(`Path traversal detected. Path must be within the project directory.`)
  }

  return resolved
}

/**
 * Browser session management.
 * Sessions persist across tool calls within a conversation.
 */
interface BrowserSession {
  browser: any // playwright Browser
  page: any // playwright Page
  context: any // playwright BrowserContext
  lastUrl: string
  createdAt: number
}

const sessions = new Map<string, BrowserSession>()

// Session cleanup timeout (30 minutes of inactivity)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const sessionTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Reset session timeout - called on each session access
 */
function resetSessionTimeout(sessionId: string): void {
  // Clear existing timeout
  const existing = sessionTimeouts.get(sessionId)
  if (existing) {
    clearTimeout(existing)
  }

  // Set new timeout for cleanup
  const timeout = setTimeout(async () => {
    log.info("Browser session timed out, closing", { sessionId })
    await closeSession(sessionId)
  }, SESSION_TIMEOUT_MS)

  sessionTimeouts.set(sessionId, timeout)
}

/**
 * Cleanup all browser sessions - call on process exit
 */
export async function cleanupAllSessions(): Promise<void> {
  for (const sessionId of sessions.keys()) {
    await closeSession(sessionId)
  }
}

// Register cleanup on process exit
process.on("beforeExit", () => {
  void cleanupAllSessions()
})
process.on("SIGINT", () => {
  void cleanupAllSessions().then(() => process.exit(0))
})
process.on("SIGTERM", () => {
  void cleanupAllSessions().then(() => process.exit(0))
})

/**
 * Get or create a browser session.
 */
async function getSession(sessionId: string): Promise<BrowserSession> {
  let session = sessions.get(sessionId)
  if (session) {
    return session
  }

  // Dynamically import playwright
  const playwright = await import("playwright").catch(() => null)
  if (!playwright) {
    throw new Error(
      "Browser automation requires Playwright. Install with: npx playwright install chromium"
    )
  }

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  })

  const page = await context.newPage()

  session = {
    browser,
    page,
    context,
    lastUrl: "",
    createdAt: Date.now(),
  }

  sessions.set(sessionId, session)
  resetSessionTimeout(sessionId)
  log.info("Created browser session", { sessionId })

  return session
}

/**
 * Close a browser session.
 */
async function closeSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId)
  if (session) {
    // Clear timeout first
    const timeout = sessionTimeouts.get(sessionId)
    if (timeout) {
      clearTimeout(timeout)
      sessionTimeouts.delete(sessionId)
    }

    await session.browser?.close()
    sessions.delete(sessionId)
    log.info("Closed browser session", { sessionId })
  }
}

/**
 * Extract content from page.
 */
async function extractContent(
  page: any,
  type: "text" | "html" | "links" | "images" | "tables" | "structured"
): Promise<string> {
  switch (type) {
    case "text":
      return await page.evaluate(() => document.body.innerText)

    case "html":
      return await page.content()

    case "links":
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]")).map((a: any) => ({
          text: a.innerText.trim(),
          href: a.href,
        }))
      })
      return JSON.stringify(links, null, 2)

    case "images":
      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("img")).map((img: any) => ({
          src: img.src,
          alt: img.alt,
          width: img.naturalWidth,
          height: img.naturalHeight,
        }))
      })
      return JSON.stringify(images, null, 2)

    case "tables":
      const tables = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("table")).map((table: any) => {
          const headers = Array.from(table.querySelectorAll("th")).map((th: any) =>
            th.innerText.trim()
          )
          const rows = Array.from(table.querySelectorAll("tr")).map((tr: any) =>
            Array.from(tr.querySelectorAll("td")).map((td: any) => td.innerText.trim())
          )
          return { headers, rows: rows.filter((r: any) => r.length > 0) }
        })
      })
      return JSON.stringify(tables, null, 2)

    case "structured":
      const structured = await page.evaluate(() => {
        const getMetadata = () => {
          const meta: Record<string, string> = {}
          document.querySelectorAll("meta").forEach((m: any) => {
            const name = m.name || m.property
            if (name) meta[name] = m.content
          })
          return meta
        }

        const getHeadings = () => {
          return Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map(
            (h: any) => ({
              level: parseInt(h.tagName[1]),
              text: h.innerText.trim(),
            })
          )
        }

        return {
          title: document.title,
          url: window.location.href,
          metadata: getMetadata(),
          headings: getHeadings(),
          mainContent: document.querySelector("main")?.innerText ||
            document.querySelector("article")?.innerText ||
            document.body.innerText.slice(0, 5000),
        }
      })
      return JSON.stringify(structured, null, 2)

    default:
      return await page.evaluate(() => document.body.innerText)
  }
}

export const BrowserTool = Tool.define("browser", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      action: z
        .enum([
          "navigate",
          "click",
          "type",
          "screenshot",
          "extract",
          "scroll",
          "wait",
          "evaluate",
          "back",
          "forward",
          "refresh",
          "close",
          "pdf",
        ])
        .describe("The browser action to perform"),

      // Navigation
      url: z.string().optional().describe("URL to navigate to (for 'navigate' action)"),

      // Interaction
      selector: z
        .string()
        .optional()
        .describe("CSS selector for click/type actions, or element selector for screenshot"),
      text: z.string().optional().describe("Text to type (for 'type' action)"),
      clearFirst: z
        .boolean()
        .optional()
        .default(true)
        .describe("Clear the input before typing (for 'type' action)"),

      // Screenshot
      path: z
        .string()
        .optional()
        .describe("Path to save screenshot/PDF (defaults to screenshots/timestamp.png)"),
      fullPage: z
        .boolean()
        .optional()
        .default(false)
        .describe("Capture full page screenshot"),

      // Extract
      extractType: z
        .enum(["text", "html", "links", "images", "tables", "structured"])
        .optional()
        .default("text")
        .describe("Type of content to extract"),

      // Scroll
      direction: z
        .enum(["up", "down", "top", "bottom"])
        .optional()
        .describe("Scroll direction"),
      amount: z.number().optional().describe("Scroll amount in pixels"),

      // Wait
      waitFor: z
        .union([z.string(), z.number()])
        .optional()
        .describe("Selector to wait for, or milliseconds to wait"),
      timeout: z.number().optional().default(30000).describe("Timeout in milliseconds"),

      // Evaluate
      script: z.string().optional().describe("JavaScript to evaluate in page context"),
    }),
    async execute(params, ctx) {
      const sessionId = ctx.sessionID || "default"

      // Handle close action
      if (params.action === "close") {
        await closeSession(sessionId)
        return {
          title: "Browser closed",
          metadata: {},
          output: "Browser session closed successfully.",
        }
      }

      // Get or create browser session
      const session = await getSession(sessionId)
      // Reset timeout on each access
      resetSessionTimeout(sessionId)

      const { page } = session

      try {
        switch (params.action) {
          case "navigate": {
            if (!params.url) {
              throw new Error("URL is required for navigate action")
            }

            // Request permission for the URL
            const url = new URL(params.url)
            await ctx.ask({
              permission: "browser",
              patterns: [url.origin + url.pathname],
              always: [url.hostname + "/*"],
              metadata: {},
            })

            await page.goto(params.url, {
              waitUntil: "networkidle",
              timeout: params.timeout,
            })

            session.lastUrl = params.url
            const title = await page.title()

            return {
              title: `Navigated to ${url.hostname}`,
              metadata: {},
              output: `Navigated to: ${params.url}\nPage title: ${title}`,
            }
          }

          case "click": {
            if (!params.selector) {
              throw new Error("Selector is required for click action")
            }

            await page.click(params.selector, { timeout: params.timeout })

            // Wait for navigation or network idle
            await page.waitForLoadState("networkidle").catch(() => {})

            const currentUrl = page.url()
            const navigated = currentUrl !== session.lastUrl
            session.lastUrl = currentUrl

            return {
              title: `Clicked ${params.selector}`,
              metadata: {},
              output: `Clicked element: ${params.selector}${navigated ? `\nNavigated to: ${currentUrl}` : ""}`,
            }
          }

          case "type": {
            if (!params.selector || params.text === undefined) {
              throw new Error("Selector and text are required for type action")
            }

            if (params.clearFirst) {
              await page.fill(params.selector, params.text)
            } else {
              await page.type(params.selector, params.text)
            }

            return {
              title: `Typed into ${params.selector}`,
              metadata: {},
              output: `Typed ${params.text.length} characters into: ${params.selector}`,
            }
          }

          case "screenshot": {
            const filename = params.path || `screenshots/screenshot-${Date.now()}.png`
            // Use safe path resolution to prevent path traversal
            const filepath = resolveSafePath(filename, Instance.directory)

            await fs.mkdir(path.dirname(filepath), { recursive: true })

            if (params.selector) {
              const element = await page.$(params.selector)
              if (!element) {
                throw new Error(`Element not found: ${params.selector}`)
              }
              await element.screenshot({ path: filepath })
            } else {
              await page.screenshot({
                path: filepath,
                fullPage: params.fullPage,
              })
            }

            return {
              title: "Screenshot saved",
              metadata: {},
              output: `Screenshot saved to: ${filepath}`,
            }
          }

          case "pdf": {
            const filename = params.path || `exports/page-${Date.now()}.pdf`
            // Use safe path resolution to prevent path traversal
            const filepath = resolveSafePath(filename, Instance.directory)

            await fs.mkdir(path.dirname(filepath), { recursive: true })

            await page.pdf({
              path: filepath,
              format: "A4",
              printBackground: true,
            })

            return {
              title: "PDF saved",
              metadata: {},
              output: `PDF saved to: ${filepath}`,
            }
          }

          case "extract": {
            const content = await extractContent(page, params.extractType || "text")
            const truncated = content.length > 50000 ? content.slice(0, 50000) + "\n...[truncated]" : content

            return {
              title: `Extracted ${params.extractType || "text"}`,
              metadata: {},
              output: truncated,
            }
          }

          case "scroll": {
            const direction = params.direction || "down"
            const amount = params.amount || 500

            await page.evaluate(
              ({ direction, amount }: { direction: string; amount: number }) => {
                switch (direction) {
                  case "up":
                    window.scrollBy(0, -amount)
                    break
                  case "down":
                    window.scrollBy(0, amount)
                    break
                  case "top":
                    window.scrollTo(0, 0)
                    break
                  case "bottom":
                    window.scrollTo(0, document.body.scrollHeight)
                    break
                }
              },
              { direction, amount }
            )

            return {
              title: `Scrolled ${direction}`,
              metadata: {},
              output: `Scrolled ${direction}${amount ? ` by ${amount}px` : ""}`,
            }
          }

          case "wait": {
            if (typeof params.waitFor === "number") {
              await page.waitForTimeout(params.waitFor)
              return {
                title: `Waited ${params.waitFor}ms`,
                metadata: {},
                output: `Waited for ${params.waitFor} milliseconds`,
              }
            } else if (typeof params.waitFor === "string") {
              await page.waitForSelector(params.waitFor, { timeout: params.timeout })
              return {
                title: `Found ${params.waitFor}`,
                metadata: {},
                output: `Element found: ${params.waitFor}`,
              }
            }
            return {
              title: "Wait completed",
              metadata: {},
              output: "Wait completed",
            }
          }

          case "evaluate": {
            if (!params.script) {
              throw new Error("Script is required for evaluate action")
            }

            // Request elevated permission for script execution
            await ctx.ask({
              permission: "browser_script",
              patterns: [params.script.slice(0, 100)],
              always: [],
              metadata: {},
            })

            const result = await page.evaluate(params.script)
            const output =
              typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)

            return {
              title: "Script executed",
              metadata: {},
              output: output,
            }
          }

          case "back": {
            await page.goBack({ waitUntil: "networkidle" })
            const currentUrl = page.url()
            session.lastUrl = currentUrl
            return {
              title: "Navigated back",
              metadata: {},
              output: `Navigated back to: ${currentUrl}`,
            }
          }

          case "forward": {
            await page.goForward({ waitUntil: "networkidle" })
            const currentUrl = page.url()
            session.lastUrl = currentUrl
            return {
              title: "Navigated forward",
              metadata: {},
              output: `Navigated forward to: ${currentUrl}`,
            }
          }

          case "refresh": {
            await page.reload({ waitUntil: "networkidle" })
            return {
              title: "Page refreshed",
              metadata: {},
              output: `Refreshed page: ${page.url()}`,
            }
          }

          default:
            throw new Error(`Unknown action: ${params.action}`)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Browser action failed: ${message}`)
      }
    },
  }
})
