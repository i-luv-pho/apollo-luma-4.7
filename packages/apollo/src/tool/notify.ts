import z from "zod"
import { Tool } from "./tool"
import { spawn } from "child_process"
import path from "path"
import DESCRIPTION from "./notify.txt"
import { Log } from "../util/log"
import { Credentials } from "./credentials"
import { Config } from "../config/config"

const log = Log.create({ service: "notify-tool" })

/**
 * Send desktop notification using platform-specific methods.
 */
async function sendDesktopNotification(
  title: string,
  message: string,
  options: { sound?: boolean; icon?: string } = {}
): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform

  try {
    if (platform === "darwin") {
      // macOS - use osascript
      const soundCmd = options.sound ? 'sound name "default"' : ""
      // Fixed: Escape all shell-dangerous characters including backticks, backslashes, and dollar signs
      const escapeForAppleScript = (str: string) =>
        str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$")
      const script = `display notification "${escapeForAppleScript(message)}" with title "${escapeForAppleScript(title)}" ${soundCmd}`

      return new Promise((resolve) => {
        const proc = spawn("osascript", ["-e", script])
        proc.on("close", (code) => {
          resolve({ success: code === 0 })
        })
        proc.on("error", (err) => {
          resolve({ success: false, error: err.message })
        })
      })
    } else if (platform === "win32") {
      // Windows - use PowerShell
      const script = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        $textNodes = $template.GetElementsByTagName("text")
        $textNodes.Item(0).AppendChild($template.CreateTextNode("${title}"))
        $textNodes.Item(1).AppendChild($template.CreateTextNode("${message}"))
        $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Apollo").Show($toast)
      `

      return new Promise((resolve) => {
        const proc = spawn("powershell", ["-Command", script])
        proc.on("close", (code) => {
          resolve({ success: code === 0 })
        })
        proc.on("error", (err) => {
          resolve({ success: false, error: err.message })
        })
      })
    } else {
      // Linux - use notify-send
      const args = [title, message]
      if (options.icon) {
        args.unshift("-i", options.icon)
      }

      return new Promise((resolve) => {
        const proc = spawn("notify-send", args)
        proc.on("close", (code) => {
          resolve({ success: code === 0 })
        })
        proc.on("error", (err) => {
          resolve({ success: false, error: err.message })
        })
      })
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Send email using SMTP.
 */
async function sendEmail(params: {
  to: string
  from?: string
  subject: string
  body: string
  html?: string
  attachments?: string[]
  smtpConfig?: {
    host: string
    port: number
    username: string
    password: string
    secure?: boolean
  }
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // @ts-ignore - nodemailer types may not be installed
    const nodemailer = await import("nodemailer").catch(() => null)
    if (!nodemailer) {
      return { success: false, error: "Email requires nodemailer. Install with: npm install nodemailer" }
    }

    // Get SMTP config from credentials or params
    let smtpConfig = params.smtpConfig
    if (!smtpConfig) {
      const cred = await Credentials.getTyped("smtp", "smtp")
      if (cred) {
        smtpConfig = {
          host: cred.host,
          port: cred.port,
          username: cred.username,
          password: cred.password,
          secure: cred.secure,
        }
      }
    }

    if (!smtpConfig) {
      return {
        success: false,
        error: "SMTP configuration required. Store credentials with name 'smtp' or provide smtpConfig.",
      }
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure ?? smtpConfig.port === 465,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    })

    const mailOptions: any = {
      from: params.from || smtpConfig.username,
      to: params.to,
      subject: params.subject,
      text: params.body,
    }

    if (params.html) {
      mailOptions.html = params.html
    }

    if (params.attachments && params.attachments.length > 0) {
      mailOptions.attachments = params.attachments.map((file) => ({
        path: file,
        filename: path.basename(file),
      }))
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Send Slack message via webhook.
 */
async function sendSlack(params: {
  webhookUrl?: string
  channel?: string
  text: string
  username?: string
  iconEmoji?: string
  blocks?: unknown[]
}): Promise<{ success: boolean; error?: string }> {
  try {
    let webhookUrl = params.webhookUrl

    if (!webhookUrl) {
      const cred = await Credentials.getTyped("slack", "webhook")
      if (cred) {
        webhookUrl = cred.url
      }
    }

    if (!webhookUrl) {
      return {
        success: false,
        error: "Slack webhook URL required. Store credential with name 'slack' or provide webhookUrl.",
      }
    }

    const payload: any = {
      text: params.text,
    }

    if (params.channel) payload.channel = params.channel
    if (params.username) payload.username = params.username
    if (params.iconEmoji) payload.icon_emoji = params.iconEmoji
    if (params.blocks) payload.blocks = params.blocks

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      return { success: true }
    } else {
      const text = await response.text()
      return { success: false, error: `Slack API error: ${text}` }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Send Discord message via webhook.
 */
async function sendDiscord(params: {
  webhookUrl?: string
  content: string
  username?: string
  avatarUrl?: string
  embeds?: unknown[]
}): Promise<{ success: boolean; error?: string }> {
  try {
    let webhookUrl = params.webhookUrl

    if (!webhookUrl) {
      const cred = await Credentials.getTyped("discord", "webhook")
      if (cred) {
        webhookUrl = cred.url
      }
    }

    if (!webhookUrl) {
      return {
        success: false,
        error: "Discord webhook URL required. Store credential with name 'discord' or provide webhookUrl.",
      }
    }

    const payload: any = {
      content: params.content,
    }

    if (params.username) payload.username = params.username
    if (params.avatarUrl) payload.avatar_url = params.avatarUrl
    if (params.embeds) payload.embeds = params.embeds

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (response.ok || response.status === 204) {
      return { success: true }
    } else {
      const text = await response.text()
      return { success: false, error: `Discord API error: ${text}` }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Send generic webhook request.
 */
async function sendWebhook(params: {
  url: string
  method?: "GET" | "POST"
  headers?: Record<string, string>
  body?: unknown
}): Promise<{ success: boolean; error?: string; response?: unknown }> {
  try {
    const response = await fetch(params.url, {
      method: params.method || "POST",
      headers: {
        "Content-Type": "application/json",
        ...params.headers,
      },
      body: params.body ? JSON.stringify(params.body) : undefined,
    })

    if (response.ok) {
      const data = await response.text()
      try {
        return { success: true, response: JSON.parse(data) }
      } catch {
        return { success: true, response: data }
      }
    } else {
      const text = await response.text()
      return { success: false, error: `Webhook error (${response.status}): ${text}` }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Send SMS via Twilio.
 */
async function sendSms(params: {
  to: string
  body: string
  from?: string
  accountSid?: string
  authToken?: string
}): Promise<{ success: boolean; error?: string; sid?: string }> {
  try {
    let accountSid = params.accountSid
    let authToken = params.authToken
    let fromNumber = params.from

    if (!accountSid || !authToken) {
      // Try to get from config
      const config = await Config.get()
      const twilioConfig = (config as any).notify?.twilio
      if (twilioConfig) {
        accountSid = accountSid || twilioConfig.accountSid
        authToken = authToken || twilioConfig.authToken
        fromNumber = fromNumber || twilioConfig.fromNumber
      }
    }

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: false,
        error: "Twilio configuration required (accountSid, authToken, from number)",
      }
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: params.to,
        From: fromNumber,
        Body: params.body,
      }),
    })

    const data = await response.json() as any

    if (response.ok) {
      return { success: true, sid: data.sid }
    } else {
      return { success: false, error: data.message || "SMS sending failed" }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export const NotifyTool = Tool.define("notify", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      channel: z
        .enum(["desktop", "email", "slack", "discord", "webhook", "sms"])
        .describe("Notification channel to use"),

      // Common
      message: z.string().describe("The notification message"),
      title: z.string().optional().describe("Notification title (for desktop, email subject)"),

      // Email specific
      to: z.string().optional().describe("Recipient email address or phone number (for email/sms)"),
      from: z.string().optional().describe("Sender email address"),
      html: z.string().optional().describe("HTML content for email"),
      attachments: z
        .array(z.string())
        .optional()
        .describe("File paths to attach to email"),

      // Slack/Discord specific
      webhookUrl: z.string().optional().describe("Webhook URL for Slack/Discord/generic webhook"),
      slackChannel: z.string().optional().describe("Slack channel to post to (if webhook supports it)"),
      username: z.string().optional().describe("Username to display for Slack/Discord message"),

      // Webhook specific
      webhookMethod: z.enum(["GET", "POST"]).optional().describe("HTTP method for webhook"),
      webhookHeaders: z.record(z.string(), z.string()).optional().describe("Custom headers for webhook"),
      webhookBody: z.unknown().optional().describe("Custom body for webhook"),

      // Desktop specific
      sound: z.boolean().optional().default(true).describe("Play notification sound (desktop)"),
      icon: z.string().optional().describe("Icon path for notification"),
    }),
    async execute(params, ctx) {
      // Request permission based on channel
      const permissionType = params.channel === "sms" ? "notify_sms" :
                            params.channel === "email" ? "notify_email" : "notify"

      await ctx.ask({
        permission: permissionType,
        patterns: [params.channel],
        always: [params.channel],
        metadata: {},
      })

      let result: { success: boolean; error?: string; [key: string]: unknown }

      switch (params.channel) {
        case "desktop":
          result = await sendDesktopNotification(
            params.title || "Apollo",
            params.message,
            { sound: params.sound, icon: params.icon }
          )
          break

        case "email":
          if (!params.to) {
            throw new Error("Email 'to' address is required")
          }
          result = await sendEmail({
            to: params.to,
            from: params.from,
            subject: params.title || "Apollo Notification",
            body: params.message,
            html: params.html,
            attachments: params.attachments,
          })
          break

        case "slack":
          result = await sendSlack({
            webhookUrl: params.webhookUrl,
            channel: params.slackChannel,
            text: params.message,
            username: params.username,
          })
          break

        case "discord":
          result = await sendDiscord({
            webhookUrl: params.webhookUrl,
            content: params.message,
            username: params.username,
          })
          break

        case "webhook":
          if (!params.webhookUrl) {
            throw new Error("Webhook URL is required for generic webhook")
          }
          result = await sendWebhook({
            url: params.webhookUrl,
            method: params.webhookMethod,
            headers: params.webhookHeaders,
            body: params.webhookBody || { message: params.message, title: params.title },
          })
          break

        case "sms":
          if (!params.to) {
            throw new Error("Phone number 'to' is required for SMS")
          }
          result = await sendSms({
            to: params.to,
            body: params.message,
            from: params.from,
          })
          break

        default:
          throw new Error(`Unknown notification channel: ${params.channel}`)
      }

      if (result.success) {
        return {
          title: `Notification sent via ${params.channel}`,
          metadata: {},
          output: `Successfully sent ${params.channel} notification${result.messageId ? ` (ID: ${result.messageId})` : ""}`,
        }
      } else {
        throw new Error(`Failed to send ${params.channel} notification: ${result.error}`)
      }
    },
  }
})
