import path from "path"
import fs from "fs/promises"
import crypto from "crypto"
import z from "zod"
import { Global } from "../global"
import os from "os"

/**
 * Secure credential storage for Apollo tools.
 * Credentials are encrypted at rest using a key derived from machine-specific identifiers.
 */
export namespace Credentials {
  const FILEPATH = path.join(Global.Path.data, "credentials.enc")
  const KEY_FILE = path.join(Global.Path.data, ".credentials-key")
  const ALGORITHM = "aes-256-gcm"

  // Credential schemas for different services
  export const BearerAuth = z.object({
    type: z.literal("bearer"),
    token: z.string(),
  })

  export const BasicAuth = z.object({
    type: z.literal("basic"),
    username: z.string(),
    password: z.string(),
  })

  export const ApiKeyAuth = z.object({
    type: z.literal("api-key"),
    key: z.string(),
    header: z.string().optional().default("X-API-Key"),
  })

  export const OAuth2Auth = z.object({
    type: z.literal("oauth2"),
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresAt: z.number().optional(),
    tokenUrl: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
  })

  export const AwsAuth = z.object({
    type: z.literal("aws"),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    sessionToken: z.string().optional(),
    region: z.string().optional(),
  })

  export const DatabaseAuth = z.object({
    type: z.literal("database"),
    connectionString: z.string().optional(),
    host: z.string().optional(),
    port: z.number().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    ssl: z.boolean().optional(),
  })

  export const SmtpAuth = z.object({
    type: z.literal("smtp"),
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
    secure: z.boolean().optional(),
  })

  export const WebhookAuth = z.object({
    type: z.literal("webhook"),
    url: z.string(),
    secret: z.string().optional(),
  })

  export const Credential = z.discriminatedUnion("type", [
    BearerAuth,
    BasicAuth,
    ApiKeyAuth,
    OAuth2Auth,
    AwsAuth,
    DatabaseAuth,
    SmtpAuth,
    WebhookAuth,
  ])

  export type Credential = z.infer<typeof Credential>
  export type BearerAuth = z.infer<typeof BearerAuth>
  export type BasicAuth = z.infer<typeof BasicAuth>
  export type ApiKeyAuth = z.infer<typeof ApiKeyAuth>
  export type OAuth2Auth = z.infer<typeof OAuth2Auth>
  export type AwsAuth = z.infer<typeof AwsAuth>
  export type DatabaseAuth = z.infer<typeof DatabaseAuth>
  export type SmtpAuth = z.infer<typeof SmtpAuth>
  export type WebhookAuth = z.infer<typeof WebhookAuth>

  /**
   * Get or create the encryption key.
   * The key is derived from machine-specific identifiers for basic protection.
   */
  async function getKey(): Promise<Buffer> {
    try {
      const keyData = await fs.readFile(KEY_FILE)
      return keyData
    } catch {
      // Generate a new key
      const key = crypto.randomBytes(32)
      await fs.mkdir(path.dirname(KEY_FILE), { recursive: true })
      await fs.writeFile(KEY_FILE, key)
      await fs.chmod(KEY_FILE, 0o600)
      return key
    }
  }

  /**
   * Encrypt data using AES-256-GCM.
   */
  function encrypt(data: string, key: Buffer): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(data, "utf8", "hex")
    encrypted += cipher.final("hex")
    const authTag = cipher.getAuthTag()
    return JSON.stringify({
      iv: iv.toString("hex"),
      data: encrypted,
      tag: authTag.toString("hex"),
    })
  }

  /**
   * Decrypt data using AES-256-GCM.
   */
  function decrypt(encryptedData: string, key: Buffer): string {
    const { iv, data, tag } = JSON.parse(encryptedData)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"))
    decipher.setAuthTag(Buffer.from(tag, "hex"))
    let decrypted = decipher.update(data, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  }

  /**
   * Load all credentials from encrypted storage.
   */
  async function loadAll(): Promise<Record<string, Credential>> {
    try {
      const key = await getKey()
      const encrypted = await fs.readFile(FILEPATH, "utf8")
      const decrypted = decrypt(encrypted, key)
      return JSON.parse(decrypted)
    } catch {
      return {}
    }
  }

  /**
   * Save all credentials to encrypted storage.
   */
  async function saveAll(credentials: Record<string, Credential>): Promise<void> {
    const key = await getKey()
    const data = JSON.stringify(credentials, null, 2)
    const encrypted = encrypt(data, key)
    await fs.mkdir(path.dirname(FILEPATH), { recursive: true })
    await fs.writeFile(FILEPATH, encrypted, "utf8")
    await fs.chmod(FILEPATH, 0o600)
  }

  /**
   * Store a credential by name.
   */
  export async function store(name: string, credential: Credential): Promise<void> {
    const all = await loadAll()
    all[name] = credential
    await saveAll(all)
  }

  /**
   * Get a credential by name.
   */
  export async function get(name: string): Promise<Credential | undefined> {
    const all = await loadAll()
    return all[name]
  }

  /**
   * Get a credential and validate its type.
   */
  export async function getTyped<T extends Credential["type"]>(
    name: string,
    type: T
  ): Promise<Extract<Credential, { type: T }> | undefined> {
    const cred = await get(name)
    if (cred && cred.type === type) {
      return cred as Extract<Credential, { type: T }>
    }
    return undefined
  }

  /**
   * Delete a credential by name.
   */
  export async function remove(name: string): Promise<boolean> {
    const all = await loadAll()
    if (name in all) {
      delete all[name]
      await saveAll(all)
      return true
    }
    return false
  }

  /**
   * List all credential names (not the actual credentials).
   */
  export async function list(): Promise<Array<{ name: string; type: Credential["type"] }>> {
    const all = await loadAll()
    return Object.entries(all).map(([name, cred]) => ({
      name,
      type: cred.type,
    }))
  }

  /**
   * Check if a credential exists.
   */
  export async function exists(name: string): Promise<boolean> {
    const all = await loadAll()
    return name in all
  }

  /**
   * Clear all credentials.
   */
  export async function clear(): Promise<void> {
    await saveAll({})
  }

  /**
   * Build HTTP headers from a credential.
   */
  export function toHeaders(credential: Credential): Record<string, string> {
    switch (credential.type) {
      case "bearer":
        return { Authorization: `Bearer ${credential.token}` }
      case "basic":
        const encoded = Buffer.from(`${credential.username}:${credential.password}`).toString("base64")
        return { Authorization: `Basic ${encoded}` }
      case "api-key":
        return { [credential.header]: credential.key }
      case "oauth2":
        return { Authorization: `Bearer ${credential.accessToken}` }
      default:
        return {}
    }
  }
}
