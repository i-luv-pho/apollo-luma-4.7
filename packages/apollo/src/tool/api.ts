import z from "zod"
import { Tool } from "./tool"
import DESCRIPTION from "./api.txt"
import { Log } from "../util/log"
import { Credentials } from "./credentials"
import path from "path"
import fs from "fs/promises"
import { Instance } from "../project/instance"

const log = Log.create({ service: "api-tool" })

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_TIMEOUT = 300000 // 5 minutes
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * SSRF Protection: Check if a hostname resolves to a private/internal IP address.
 * Blocks requests to localhost, private networks, link-local, and metadata endpoints.
 */
function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()

  // Block localhost variants
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "::1" ||
    lower === "[::1]" ||
    lower.endsWith(".localhost")
  ) {
    return true
  }

  // Block common cloud metadata endpoints
  if (
    lower === "169.254.169.254" || // AWS/GCP/Azure metadata
    lower === "metadata.google.internal" ||
    lower === "metadata.goog" ||
    lower.endsWith(".internal") ||
    lower === "100.100.100.200" // Alibaba Cloud metadata
  ) {
    return true
  }

  // Check for private IP ranges (IPv4)
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number)
    // 10.0.0.0/8
    if (a === 10) return true
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true
    // 127.0.0.0/8 (loopback)
    if (a === 127) return true
    // 169.254.0.0/16 (link-local)
    if (a === 169 && b === 254) return true
    // 0.0.0.0
    if (a === 0 && b === 0 && c === 0 && d === 0) return true
  }

  return false
}

/**
 * Validate URL for SSRF protection.
 * Returns the validated URL or throws if it's a blocked target.
 */
function validateUrlForSSRF(urlString: string): URL {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    throw new Error(`Invalid URL: ${urlString}`)
  }

  // Only allow http and https protocols
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Invalid protocol: ${url.protocol}. Only http and https are allowed.`)
  }

  // Block private/internal hosts
  if (isPrivateHost(url.hostname)) {
    throw new Error(`SSRF protection: Requests to internal/private addresses are blocked.`)
  }

  // Block file:// and other schemes that might be abused
  if (url.username || url.password) {
    throw new Error(`URLs with embedded credentials are not allowed.`)
  }

  return url
}

/**
 * Parse response body based on content type.
 */
async function parseResponse(
  response: Response,
  preferredType?: "json" | "text" | "binary"
): Promise<{ type: string; data: unknown; size: number }> {
  const contentType = response.headers.get("content-type") || ""
  const contentLength = parseInt(response.headers.get("content-length") || "0", 10)

  if (contentLength > MAX_RESPONSE_SIZE) {
    return {
      type: "error",
      data: `Response too large: ${contentLength} bytes (max ${MAX_RESPONSE_SIZE})`,
      size: contentLength,
    }
  }

  // Binary response
  if (preferredType === "binary" || contentType.includes("octet-stream") || contentType.includes("image/") || contentType.includes("audio/") || contentType.includes("video/") || contentType.includes("application/pdf") || contentType.includes("application/zip")) {
    const buffer = await response.arrayBuffer()
    return {
      type: "binary",
      data: `Binary data: ${buffer.byteLength} bytes (${contentType})`,
      size: buffer.byteLength,
    }
  }

  // JSON response
  if (preferredType === "json" || contentType.includes("json")) {
    try {
      const text = await response.text()
      const json = JSON.parse(text)
      return { type: "json", data: json, size: text.length }
    } catch {
      const text = await response.text()
      return { type: "text", data: text, size: text.length }
    }
  }

  // Text response (HTML, XML, plain text, etc.)
  const text = await response.text()
  return { type: "text", data: text, size: text.length }
}

/**
 * Build headers from authentication configuration.
 */
async function buildAuthHeaders(
  auth?: {
    type: "bearer" | "basic" | "api-key" | "oauth2" | "credential"
    token?: string
    username?: string
    password?: string
    key?: string
    keyHeader?: string
    credentialName?: string
  }
): Promise<Record<string, string>> {
  if (!auth) return {}

  // Use stored credential
  if (auth.type === "credential" && auth.credentialName) {
    const cred = await Credentials.get(auth.credentialName)
    if (cred) {
      return Credentials.toHeaders(cred)
    }
    throw new Error(`Credential not found: ${auth.credentialName}`)
  }

  switch (auth.type) {
    case "bearer":
      if (!auth.token) throw new Error("Bearer token required")
      return { Authorization: `Bearer ${auth.token}` }

    case "basic":
      if (!auth.username || !auth.password) throw new Error("Username and password required for basic auth")
      const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString("base64")
      return { Authorization: `Basic ${encoded}` }

    case "api-key":
      if (!auth.key) throw new Error("API key required")
      const header = auth.keyHeader || "X-API-Key"
      return { [header]: auth.key }

    case "oauth2":
      if (!auth.token) throw new Error("OAuth2 access token required")
      return { Authorization: `Bearer ${auth.token}` }

    default:
      return {}
  }
}

/**
 * Format headers for output (hiding sensitive values).
 */
function formatHeaders(headers: Record<string, string>): Record<string, string> {
  const sensitive = ["authorization", "x-api-key", "cookie", "set-cookie"]
  const formatted: Record<string, string> = {}

  for (const [key, value] of Object.entries(headers)) {
    if (sensitive.includes(key.toLowerCase())) {
      formatted[key] = "[REDACTED]"
    } else {
      formatted[key] = value
    }
  }

  return formatted
}

/**
 * Build form data from object.
 */
function buildFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData()

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Blob) {
      formData.append(key, value)
    } else if (typeof value === "object" && value !== null) {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, String(value))
    }
  }

  return formData
}

export const ApiTool = Tool.define("api", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      method: z
        .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
        .describe("HTTP method to use"),
      url: z.string().describe("The URL to send the request to"),
      headers: z
        .record(z.string(), z.string())
        .optional()
        .describe("HTTP headers to include in the request"),
      body: z
        .union([z.string(), z.record(z.string(), z.unknown())])
        .optional()
        .describe("Request body. Can be a string or JSON object."),
      bodyType: z
        .enum(["json", "form", "text", "multipart"])
        .optional()
        .default("json")
        .describe("How to encode the body: json (default), form (URL-encoded), text (raw string), multipart (file upload)"),
      auth: z
        .object({
          type: z.enum(["bearer", "basic", "api-key", "oauth2", "credential"]),
          token: z.string().optional(),
          username: z.string().optional(),
          password: z.string().optional(),
          key: z.string().optional(),
          keyHeader: z.string().optional(),
          credentialName: z.string().optional(),
        })
        .optional()
        .describe("Authentication configuration. Use 'credential' type with credentialName to use stored credentials."),
      timeout: z
        .number()
        .optional()
        .default(DEFAULT_TIMEOUT)
        .describe(`Request timeout in milliseconds (default: ${DEFAULT_TIMEOUT}, max: ${MAX_TIMEOUT})`),
      followRedirects: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to follow HTTP redirects (default: true)"),
      responseType: z
        .enum(["json", "text", "binary"])
        .optional()
        .describe("Expected response type. If not specified, will be inferred from Content-Type header."),
      saveTo: z
        .string()
        .optional()
        .describe("Path to save the response body to. Useful for downloading files."),
    }),
    async execute(params, ctx) {
      // Validate URL with SSRF protection
      const url = validateUrlForSSRF(params.url)

      // Request permission
      await ctx.ask({
        permission: "api",
        patterns: [url.origin + url.pathname],
        always: [url.origin + "/*"],
        metadata: {},
      })

      // Build headers
      const headers: Record<string, string> = {
        "User-Agent": "Apollo/1.0",
        ...params.headers,
      }

      // Add auth headers
      if (params.auth) {
        const authHeaders = await buildAuthHeaders(params.auth)
        Object.assign(headers, authHeaders)
      }

      // Build body
      let body: BodyInit | undefined
      if (params.body && !["GET", "HEAD", "OPTIONS"].includes(params.method)) {
        switch (params.bodyType) {
          case "json":
            headers["Content-Type"] = headers["Content-Type"] || "application/json"
            body = typeof params.body === "string" ? params.body : JSON.stringify(params.body)
            break

          case "form":
            headers["Content-Type"] = headers["Content-Type"] || "application/x-www-form-urlencoded"
            if (typeof params.body === "object") {
              body = new URLSearchParams(params.body as Record<string, string>).toString()
            } else {
              body = params.body
            }
            break

          case "multipart":
            // Don't set Content-Type - fetch will set it with boundary
            if (typeof params.body === "object") {
              body = buildFormData(params.body as Record<string, unknown>)
            }
            break

          case "text":
          default:
            body = typeof params.body === "string" ? params.body : JSON.stringify(params.body)
            break
        }
      }

      // Make request
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        Math.min(params.timeout || DEFAULT_TIMEOUT, MAX_TIMEOUT)
      )

      try {
        log.info("API request", {
          method: params.method,
          url: params.url,
          headers: formatHeaders(headers),
        })

        const startTime = Date.now()
        const response = await fetch(params.url, {
          method: params.method,
          headers,
          body,
          signal: controller.signal,
          redirect: params.followRedirects ? "follow" : "manual",
        })
        const duration = Date.now() - startTime

        clearTimeout(timeoutId)

        // Parse response
        const parsed = await parseResponse(response, params.responseType)

        // Save to file if requested
        if (params.saveTo && parsed.type !== "error") {
          // Prevent path traversal attacks
          if (path.isAbsolute(params.saveTo)) {
            throw new Error("Absolute paths are not allowed for saveTo. Use a relative path.")
          }
          const savePath = path.resolve(Instance.directory, params.saveTo)
          const normalizedBase = path.resolve(Instance.directory)
          if (!savePath.startsWith(normalizedBase + path.sep) && savePath !== normalizedBase) {
            throw new Error("Path traversal detected. saveTo must be within the project directory.")
          }

          await fs.mkdir(path.dirname(savePath), { recursive: true })

          if (parsed.type === "binary") {
            const buffer = await response.clone().arrayBuffer()
            await fs.writeFile(savePath, Buffer.from(buffer))
          } else {
            await fs.writeFile(
              savePath,
              typeof parsed.data === "string" ? parsed.data : JSON.stringify(parsed.data, null, 2)
            )
          }
        }

        // Format response headers
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        // Build output
        const output = {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          duration: `${duration}ms`,
          size: parsed.size,
          body: parsed.data,
          savedTo: params.saveTo,
        }

        const outputStr =
          parsed.type === "json"
            ? JSON.stringify(output, null, 2)
            : `Status: ${response.status} ${response.statusText}
Duration: ${duration}ms
Size: ${parsed.size} bytes
${params.saveTo ? `Saved to: ${params.saveTo}\n` : ""}
Response:
${typeof parsed.data === "string" ? parsed.data : JSON.stringify(parsed.data, null, 2)}`

        return {
          title: `${params.method} ${response.status}`,
          metadata: {},
          output: outputStr,
        }
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(`Request timed out after ${params.timeout}ms`)
        }

        throw error
      }
    },
  }
})
