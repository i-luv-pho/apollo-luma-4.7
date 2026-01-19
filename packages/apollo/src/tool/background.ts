import z from "zod"
import { Tool } from "./tool"
import { spawn, ChildProcess } from "child_process"
import path from "path"
import fs from "fs/promises"
import { randomBytes } from "crypto"
import DESCRIPTION from "./background.txt"
import { Log } from "../util/log"
import { Instance } from "../project/instance"
import { Global } from "../global"
import { Shell } from "../shell/shell"

const log = Log.create({ service: "background-tool" })

/**
 * Background task state.
 */
interface BackgroundTask {
  id: string
  name: string
  command: string
  cwd: string
  pid: number
  status: "running" | "stopped" | "failed" | "completed"
  startedAt: number
  endedAt?: number
  exitCode?: number
  logFile: string
}

/**
 * Active processes (in memory).
 */
const processes = new Map<string, ChildProcess>()

/**
 * Tasks directory.
 */
const TASKS_DIR = path.join(Global.Path.data, "tasks")

/**
 * Generate unique task ID using cryptographically secure random bytes.
 */
function generateId(): string {
  // Security: Use crypto.randomBytes instead of Math.random() for unpredictable IDs
  const randomPart = randomBytes(4).toString("hex")
  return `task_${Date.now()}_${randomPart}`
}

/**
 * Get task file path.
 */
function taskFile(id: string): string {
  return path.join(TASKS_DIR, `${id}.json`)
}

/**
 * Load task metadata.
 */
async function loadTask(id: string): Promise<BackgroundTask | null> {
  try {
    const data = await fs.readFile(taskFile(id), "utf-8")
    return JSON.parse(data)
  } catch {
    return null
  }
}

/**
 * Save task metadata.
 */
async function saveTask(task: BackgroundTask): Promise<void> {
  await fs.mkdir(TASKS_DIR, { recursive: true })
  await fs.writeFile(taskFile(task.id), JSON.stringify(task, null, 2))
}

/**
 * List all tasks.
 */
async function listTasks(): Promise<BackgroundTask[]> {
  try {
    await fs.mkdir(TASKS_DIR, { recursive: true })
    const files = await fs.readdir(TASKS_DIR)
    const tasks: BackgroundTask[] = []

    for (const file of files) {
      if (file.endsWith(".json")) {
        const id = file.replace(".json", "")
        const task = await loadTask(id)
        if (task) {
          // Check if process is still running
          if (task.status === "running" && task.pid) {
            try {
              process.kill(task.pid, 0) // Check if process exists
            } catch {
              task.status = "stopped"
              await saveTask(task)
            }
          }
          tasks.push(task)
        }
      }
    }

    return tasks.sort((a, b) => b.startedAt - a.startedAt)
  } catch {
    return []
  }
}

/**
 * Start a background task.
 */
async function startTask(
  command: string,
  options: { name?: string; cwd?: string; env?: Record<string, string> }
): Promise<BackgroundTask> {
  const id = generateId()
  const name = options.name || command.slice(0, 30)
  const cwd = options.cwd || Instance.directory
  const logFile = path.join(TASKS_DIR, `${id}.log`)

  // Ensure tasks directory exists
  await fs.mkdir(TASKS_DIR, { recursive: true })

  // Create log file
  const logStream = await fs.open(logFile, "w")

  // Get shell
  const shell = Shell.acceptable()

  // Spawn process
  const proc = spawn(command, {
    shell,
    cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  })

  // Store process reference
  processes.set(id, proc)

  // Pipe output to log file
  const writeLog = async (data: Buffer) => {
    const timestamp = new Date().toISOString()
    const lines = data.toString().split("\n")
    for (const line of lines) {
      if (line.trim()) {
        await logStream.write(`[${timestamp}] ${line}\n`)
      }
    }
  }

  proc.stdout?.on("data", writeLog)
  proc.stderr?.on("data", writeLog)

  // Create task metadata
  const task: BackgroundTask = {
    id,
    name,
    command,
    cwd,
    pid: proc.pid!,
    status: "running",
    startedAt: Date.now(),
    logFile,
  }

  await saveTask(task)

  // Handle process exit
  proc.on("close", async (code) => {
    task.status = code === 0 ? "completed" : "failed"
    task.exitCode = code ?? undefined
    task.endedAt = Date.now()
    await saveTask(task)
    await logStream.close()
    processes.delete(id)
    log.info("Background task ended", { id, name, exitCode: code })
  })

  proc.on("error", async (err) => {
    task.status = "failed"
    task.endedAt = Date.now()
    await saveTask(task)
    await logStream.write(`[ERROR] ${err.message}\n`)
    await logStream.close()
    processes.delete(id)
    log.error("Background task error", { id, name, error: err.message })
  })

  log.info("Started background task", { id, name, pid: proc.pid })

  return task
}

/**
 * Stop a background task.
 */
async function stopTask(id: string): Promise<{ success: boolean; error?: string }> {
  const task = await loadTask(id)
  if (!task) {
    return { success: false, error: "Task not found" }
  }

  if (task.status !== "running") {
    return { success: false, error: `Task is not running (status: ${task.status})` }
  }

  // Try to kill the process
  const proc = processes.get(id)
  if (proc) {
    try {
      await Shell.killTree(proc, { exited: () => task.status !== "running" })
      task.status = "stopped"
      task.endedAt = Date.now()
      await saveTask(task)
      processes.delete(id)
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  // Process not in memory, try to kill by PID
  try {
    process.kill(task.pid, "SIGTERM")
    // Wait a bit then force kill if needed
    await new Promise((resolve) => setTimeout(resolve, 1000))
    try {
      process.kill(task.pid, 0) // Check if still running
      process.kill(task.pid, "SIGKILL") // Force kill
    } catch {
      // Process already gone
    }
    task.status = "stopped"
    task.endedAt = Date.now()
    await saveTask(task)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Get task logs.
 */
async function getTaskLogs(
  id: string,
  options: { lines?: number; follow?: boolean } = {}
): Promise<{ success: boolean; logs?: string; error?: string }> {
  const task = await loadTask(id)
  if (!task) {
    return { success: false, error: "Task not found" }
  }

  try {
    const content = await fs.readFile(task.logFile, "utf-8")
    const lines = content.split("\n")
    const lastLines = options.lines ? lines.slice(-options.lines) : lines
    return { success: true, logs: lastLines.join("\n") }
  } catch (e) {
    return { success: false, error: `Failed to read logs: ${e instanceof Error ? e.message : String(e)}` }
  }
}

/**
 * Clean up old completed tasks.
 */
async function cleanupTasks(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  const tasks = await listTasks()
  const cutoff = Date.now() - maxAge
  let cleaned = 0

  for (const task of tasks) {
    if (task.status !== "running" && task.startedAt < cutoff) {
      try {
        await fs.unlink(taskFile(task.id))
        await fs.unlink(task.logFile).catch(() => {})
        cleaned++
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  return cleaned
}

export const BackgroundTool = Tool.define("background", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      action: z
        .enum(["start", "status", "logs", "stop", "list", "cleanup"])
        .describe("Background task action"),

      // For start
      command: z.string().optional().describe("Command to run in background"),
      name: z.string().optional().describe("Friendly name for the task"),
      cwd: z.string().optional().describe("Working directory"),
      env: z.record(z.string(), z.string()).optional().describe("Environment variables"),

      // For status/logs/stop
      taskId: z.string().optional().describe("Task ID to operate on"),

      // For logs
      lines: z.number().optional().default(50).describe("Number of log lines to return"),
    }),
    async execute(params, ctx) {
      // Request permission
      await ctx.ask({
        permission: "background",
        patterns: [params.action],
        always: [params.action],
        metadata: {},
      })

      switch (params.action) {
        case "start": {
          if (!params.command) {
            throw new Error("Command is required to start a background task")
          }

          const task = await startTask(params.command, {
            name: params.name,
            cwd: params.cwd,
            env: params.env,
          })

          return {
            title: `Started: ${task.name}`,
            metadata: {},
            output: `Background task started
ID: ${task.id}
Name: ${task.name}
PID: ${task.pid}
Command: ${task.command}
Log file: ${task.logFile}

Use "action: logs, taskId: ${task.id}" to view output
Use "action: stop, taskId: ${task.id}" to stop the task`,
          }
        }

        case "list": {
          const tasks = await listTasks()

          if (tasks.length === 0) {
            return {
              title: "No background tasks",
              metadata: {},
              output: "No background tasks found.",
            }
          }

          const output = tasks
            .map((t) => {
              const duration = t.endedAt
                ? `${Math.round((t.endedAt - t.startedAt) / 1000)}s`
                : `${Math.round((Date.now() - t.startedAt) / 1000)}s`
              return `${t.status === "running" ? "🟢" : t.status === "completed" ? "✅" : "🔴"} ${t.id}
   Name: ${t.name}
   Status: ${t.status}${t.exitCode !== undefined ? ` (exit: ${t.exitCode})` : ""}
   Duration: ${duration}
   Command: ${t.command.slice(0, 50)}${t.command.length > 50 ? "..." : ""}`
            })
            .join("\n\n")

          return {
            title: `${tasks.length} background tasks`,
            metadata: {},
            output,
          }
        }

        case "status": {
          if (!params.taskId) {
            throw new Error("Task ID is required for status check")
          }

          const task = await loadTask(params.taskId)
          if (!task) {
            throw new Error(`Task not found: ${params.taskId}`)
          }

          // Verify running status
          if (task.status === "running") {
            try {
              process.kill(task.pid, 0)
            } catch {
              task.status = "stopped"
              await saveTask(task)
            }
          }

          const duration = task.endedAt
            ? `${Math.round((task.endedAt - task.startedAt) / 1000)}s`
            : `${Math.round((Date.now() - task.startedAt) / 1000)}s (running)`

          return {
            title: `Task: ${task.status}`,
            metadata: {},
            output: `Task: ${task.id}
Name: ${task.name}
Status: ${task.status}
PID: ${task.pid}
Command: ${task.command}
Working dir: ${task.cwd}
Duration: ${duration}
${task.exitCode !== undefined ? `Exit code: ${task.exitCode}` : ""}
Log file: ${task.logFile}`,
          }
        }

        case "logs": {
          if (!params.taskId) {
            throw new Error("Task ID is required to view logs")
          }

          const result = await getTaskLogs(params.taskId, { lines: params.lines })

          if (!result.success) {
            throw new Error(result.error!)
          }

          return {
            title: `Logs for ${params.taskId}`,
            metadata: {},
            output: result.logs || "(no output)",
          }
        }

        case "stop": {
          if (!params.taskId) {
            throw new Error("Task ID is required to stop a task")
          }

          const result = await stopTask(params.taskId)

          if (!result.success) {
            throw new Error(result.error!)
          }

          return {
            title: "Task stopped",
            metadata: {},
            output: `Successfully stopped task: ${params.taskId}`,
          }
        }

        case "cleanup": {
          const cleaned = await cleanupTasks()
          return {
            title: `Cleaned ${cleaned} tasks`,
            metadata: {},
            output: `Removed ${cleaned} old completed tasks`,
          }
        }

        default:
          throw new Error(`Unknown action: ${params.action}`)
      }
    },
  }
})
