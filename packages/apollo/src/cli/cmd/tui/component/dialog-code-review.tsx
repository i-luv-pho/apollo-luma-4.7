import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import { useTheme } from "../context/theme"
import { useDialog } from "../ui/dialog"
import { useToast } from "../ui/toast"
import { useSDK } from "../context/sdk"
import { useLocal } from "../context/local"
import { useRoute } from "../context/route"
import { createSignal, createMemo, Show, For, onMount, createEffect } from "solid-js"
import { $ } from "bun"
import { Identifier } from "@/id/id"

type ReviewStatus = "idle" | "running" | "complete" | "error"

interface ReviewAgent {
  id: string
  name: string
  description: string
  enabled: boolean
  status: ReviewStatus
  result?: string
  issues?: ReviewIssue[]
}

interface ReviewIssue {
  severity: "critical" | "warning" | "suggestion"
  title: string
  description: string
  file?: string
  line?: number
  confidence: number
}

interface DiffInfo {
  base: string
  head: string
  files: string[]
  additions: number
  deletions: number
}

const DEFAULT_AGENTS: Omit<ReviewAgent, "status" | "result" | "issues">[] = [
  {
    id: "security",
    name: "Security",
    description: "Check for vulnerabilities, injection attacks, auth issues",
    enabled: true,
  },
  {
    id: "quality",
    name: "Code Quality",
    description: "Review code structure, patterns, and maintainability",
    enabled: true,
  },
  {
    id: "performance",
    name: "Performance",
    description: "Identify performance bottlenecks and optimizations",
    enabled: true,
  },
  {
    id: "tests",
    name: "Test Coverage",
    description: "Check for missing tests and test quality",
    enabled: true,
  },
]

export function DialogCodeReview() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const toast = useToast()
  const sdk = useSDK()
  const local = useLocal()
  const route = useRoute()

  const [step, setStep] = createSignal<"config" | "running" | "results">("config")
  const [baseBranch, setBaseBranch] = createSignal("main")
  const [diffInfo, setDiffInfo] = createSignal<DiffInfo | null>(null)
  const [agents, setAgents] = createSignal<ReviewAgent[]>(
    DEFAULT_AGENTS.map((a) => ({ ...a, status: "idle" as ReviewStatus }))
  )
  const [overallProgress, setOverallProgress] = createSignal(0)
  const [selectedAgent, setSelectedAgent] = createSignal(0)
  const [error, setError] = createSignal<string | null>(null)

  // Detect current branch info on mount
  onMount(async () => {
    try {
      // Get default branch
      const defaultBranch = (
        await $`git remote show origin 2>/dev/null | grep 'HEAD branch' | cut -d' ' -f5`.quiet().nothrow().text()
      ).trim()
      if (defaultBranch) setBaseBranch(defaultBranch)

      // Get diff stats
      await updateDiffInfo()
    } catch (e) {
      setError(`Failed to get git info: ${e}`)
    }
  })

  async function updateDiffInfo() {
    const base = baseBranch()
    try {
      const head = (await $`git rev-parse --abbrev-ref HEAD`.quiet().text()).trim()
      const diffStat = await $`git diff --stat ${base}...HEAD`.quiet().nothrow().text()
      const files = (await $`git diff --name-only ${base}...HEAD`.quiet().nothrow().text())
        .trim()
        .split("\n")
        .filter(Boolean)

      // Parse additions/deletions from diffstat
      const lastLine = diffStat.trim().split("\n").pop() || ""
      const additions = parseInt(lastLine.match(/(\d+) insertion/)?.[1] || "0")
      const deletions = parseInt(lastLine.match(/(\d+) deletion/)?.[1] || "0")

      setDiffInfo({
        base,
        head,
        files,
        additions,
        deletions,
      })
    } catch {
      setDiffInfo(null)
    }
  }

  const enabledAgents = createMemo(() => agents().filter((a) => a.enabled))

  const allIssues = createMemo(() => {
    const issues: ReviewIssue[] = []
    for (const agent of agents()) {
      if (agent.issues) {
        issues.push(...agent.issues)
      }
    }
    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, suggestion: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
  })

  const issuesSummary = createMemo(() => {
    const issues = allIssues()
    return {
      critical: issues.filter((i) => i.severity === "critical").length,
      warning: issues.filter((i) => i.severity === "warning").length,
      suggestion: issues.filter((i) => i.severity === "suggestion").length,
    }
  })

  useKeyboard((evt) => {
    if (evt.name === "escape") {
      dialog.clear()
      return
    }

    const currentStep = step()

    if (currentStep === "config") {
      if (evt.name === "up" || evt.name === "k") {
        setSelectedAgent((i) => Math.max(0, i - 1))
      } else if (evt.name === "down" || evt.name === "j") {
        setSelectedAgent((i) => Math.min(agents().length - 1, i + 1))
      } else if (evt.name === "space" || evt.name === "x") {
        // Toggle agent enabled
        setAgents((prev) =>
          prev.map((a, i) => (i === selectedAgent() ? { ...a, enabled: !a.enabled } : a))
        )
      } else if (evt.name === "return") {
        startReview()
      }
      return
    }

    if (currentStep === "results") {
      if (evt.name === "return") {
        dialog.clear()
      }
    }
  })

  async function startReview() {
    const enabled = enabledAgents()
    if (enabled.length === 0) {
      toast.show({ variant: "warning", message: "Select at least one review agent", duration: 2000 })
      return
    }

    const diff = diffInfo()
    if (!diff || diff.files.length === 0) {
      toast.show({ variant: "warning", message: "No changes to review", duration: 2000 })
      return
    }

    setStep("running")
    setOverallProgress(0)

    // Get the diff content
    const diffContent = await $`git diff ${diff.base}...HEAD`.quiet().text()

    // Run each agent
    const totalAgents = enabled.length
    let completedAgents = 0

    for (const agent of enabled) {
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: "running" as ReviewStatus } : a))
      )

      try {
        const result = await runReviewAgent(agent, diffContent, diff.files)
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id
              ? { ...a, status: "complete" as ReviewStatus, result: result.summary, issues: result.issues }
              : a
          )
        )
      } catch (e) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id ? { ...a, status: "error" as ReviewStatus, result: String(e) } : a
          )
        )
      }

      completedAgents++
      setOverallProgress(Math.round((completedAgents / totalAgents) * 100))
    }

    setStep("results")
  }

  async function runReviewAgent(
    agent: ReviewAgent,
    diffContent: string,
    files: string[]
  ): Promise<{ summary: string; issues: ReviewIssue[] }> {
    const prompts: Record<string, string> = {
      security: `You are a security code reviewer. Review the following code changes for security vulnerabilities.

Focus on:
- SQL injection, XSS, command injection
- Authentication and authorization issues
- Sensitive data exposure
- Insecure cryptography
- OWASP Top 10 vulnerabilities

Respond with a JSON object containing:
{
  "summary": "Brief 1-2 sentence summary",
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "title": "Short issue title",
      "description": "Detailed explanation",
      "file": "path/to/file.ts",
      "line": 42,
      "confidence": 85
    }
  ]
}

Only include issues with confidence >= 70%.

Files changed: ${files.join(", ")}

<diff>
${diffContent.slice(0, 50000)}
</diff>`,

      quality: `You are a code quality reviewer. Review the following code changes for code quality issues.

Focus on:
- Code structure and organization
- DRY principle violations
- Complex nested logic
- Unclear naming
- Missing error handling
- Code that doesn't follow project patterns

Respond with a JSON object containing:
{
  "summary": "Brief 1-2 sentence summary",
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "title": "Short issue title",
      "description": "Detailed explanation",
      "file": "path/to/file.ts",
      "line": 42,
      "confidence": 85
    }
  ]
}

Only include issues with confidence >= 70%.

Files changed: ${files.join(", ")}

<diff>
${diffContent.slice(0, 50000)}
</diff>`,

      performance: `You are a performance code reviewer. Review the following code changes for performance issues.

Focus on:
- O(n²) or worse algorithms on unbounded data
- N+1 query patterns
- Blocking I/O on hot paths
- Memory leaks
- Unnecessary re-renders (React)
- Missing caching opportunities

Respond with a JSON object containing:
{
  "summary": "Brief 1-2 sentence summary",
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "title": "Short issue title",
      "description": "Detailed explanation",
      "file": "path/to/file.ts",
      "line": 42,
      "confidence": 85
    }
  ]
}

Only include issues with confidence >= 70%.

Files changed: ${files.join(", ")}

<diff>
${diffContent.slice(0, 50000)}
</diff>`,

      tests: `You are a test coverage reviewer. Review the following code changes for testing issues.

Focus on:
- Missing test coverage for new code
- Edge cases not covered
- Broken existing tests
- Test quality issues
- Missing integration tests for critical paths

Respond with a JSON object containing:
{
  "summary": "Brief 1-2 sentence summary",
  "issues": [
    {
      "severity": "critical" | "warning" | "suggestion",
      "title": "Short issue title",
      "description": "Detailed explanation",
      "file": "path/to/file.ts",
      "line": 42,
      "confidence": 85
    }
  ]
}

Only include issues with confidence >= 70%.

Files changed: ${files.join(", ")}

<diff>
${diffContent.slice(0, 50000)}
</diff>`,
    }

    const prompt = prompts[agent.id]
    if (!prompt) {
      return { summary: "Unknown agent type", issues: [] }
    }

    // Create a quick session for the review
    const sessionResult = await sdk.client.session.create({})
    const sessionID = sessionResult.data!.id
    const model = local.model.current()

    try {
      await sdk.client.session.prompt({
        sessionID,
        messageID: Identifier.ascending("message"),
        model: model ? { providerID: model.providerID, modelID: model.modelID } : undefined,
        parts: [
          {
            id: Identifier.ascending("part"),
            type: "text",
            text: prompt,
          },
        ],
      })

      // Poll for completion - check if the last assistant message has time.completed set
      const maxAttempts = 120 // 2 minutes max (120 * 1000ms)
      let attempts = 0
      let lastMessage: { info: { id: string; role: string; time: { completed?: number } }; parts: { type: string; text?: string }[] } | undefined

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++

        const messagesResult = await sdk.client.session.messages({ sessionID, limit: 10 })
        const messages = messagesResult.data ?? []
        lastMessage = messages.findLast(
          (m) => m.info.role === "assistant"
        ) as typeof lastMessage

        // Check if message is complete
        if (lastMessage?.info.time.completed) {
          break
        }
      }

      if (!lastMessage) {
        // Fallback: get messages one more time
        const messagesResult = await sdk.client.session.messages({ sessionID, limit: 10 })
        const messages = messagesResult.data ?? []
        lastMessage = messages.findLast(
          (m) => m.info.role === "assistant"
        ) as typeof lastMessage
      }

      if (!lastMessage) {
        return { summary: "No response received", issues: [] }
      }

      // Find text part in the message
      const textPart = lastMessage.parts.find(
        (p) => p.type === "text" && p.text
      )

      if (!textPart || textPart.type !== "text" || !textPart.text) {
        return { summary: "No text response", issues: [] }
      }

      // Try to extract JSON from the response
      const textContent = textPart.text
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            summary: parsed.summary || "Review complete",
            issues: (parsed.issues || []).filter((i: ReviewIssue) => i.confidence >= 70),
          }
        } catch {
          return { summary: textContent.slice(0, 200), issues: [] }
        }
      }

      return { summary: textContent.slice(0, 200), issues: [] }
    } finally {
      // Clean up the session
      await sdk.client.session.delete({ sessionID }).catch(() => {})
    }
  }

  const severityColor = (severity: ReviewIssue["severity"]) => {
    switch (severity) {
      case "critical":
        return theme.error
      case "warning":
        return theme.warning
      case "suggestion":
        return theme.primary
    }
  }

  const severityIcon = (severity: ReviewIssue["severity"]) => {
    switch (severity) {
      case "critical":
        return "!"
      case "warning":
        return "~"
      case "suggestion":
        return "?"
    }
  }

  const statusIcon = (status: ReviewStatus) => {
    switch (status) {
      case "idle":
        return "○"
      case "running":
        return "◐"
      case "complete":
        return "●"
      case "error":
        return "✗"
    }
  }

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} flexDirection="column" paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          Code Review
        </text>
        <text fg={theme.textMuted}>esc to close</text>
      </box>

      {/* Config Step */}
      <Show when={step() === "config"}>
        <Show when={error()}>
          <text fg={theme.error}>{error()}</text>
        </Show>

        <Show when={diffInfo()}>
          {(info) => (
            <box flexDirection="column" gap={1}>
              <box flexDirection="row" gap={2}>
                <text fg={theme.textMuted}>Base:</text>
                <text fg={theme.text}>{info().base}</text>
                <text fg={theme.textMuted}>→</text>
                <text fg={theme.primary}>{info().head}</text>
              </box>
              <box flexDirection="row" gap={2}>
                <text fg={theme.textMuted}>
                  {info().files.length} files | +{info().additions} -{info().deletions}
                </text>
              </box>
            </box>
          )}
        </Show>

        <box marginTop={1} flexDirection="column">
          <text fg={theme.text} attributes={TextAttributes.BOLD}>
            Select review agents:
          </text>
          <For each={agents()}>
            {(agent, index) => (
              <box flexDirection="row" gap={1}>
                <text fg={selectedAgent() === index() ? theme.primary : theme.textMuted}>
                  {selectedAgent() === index() ? ">" : " "}
                </text>
                <text fg={agent.enabled ? theme.success : theme.textMuted}>
                  [{agent.enabled ? "x" : " "}]
                </text>
                <text fg={selectedAgent() === index() ? theme.text : theme.textMuted}>
                  {agent.name}
                </text>
                <text fg={theme.textMuted}>- {agent.description}</text>
              </box>
            )}
          </For>
        </box>

        <box marginTop={1}>
          <text fg={theme.textMuted}>↑/↓ navigate, space toggle, enter start</text>
        </box>

        <box marginTop={1} flexDirection="row">
          <box paddingLeft={3} paddingRight={3} backgroundColor={theme.primary} onMouseUp={startReview}>
            <text fg={theme.selectedListItemText}>Start Review</text>
          </box>
        </box>
      </Show>

      {/* Running Step */}
      <Show when={step() === "running"}>
        <box flexDirection="column" gap={1}>
          <box flexDirection="row" gap={1}>
            <text fg={theme.text}>Progress:</text>
            <text fg={theme.primary}>{overallProgress()}%</text>
          </box>

          <box flexDirection="column">
            <For each={enabledAgents()}>
              {(agent) => (
                <box flexDirection="row" gap={1}>
                  <text
                    fg={
                      agent.status === "complete"
                        ? theme.success
                        : agent.status === "error"
                          ? theme.error
                          : agent.status === "running"
                            ? theme.warning
                            : theme.textMuted
                    }
                  >
                    {statusIcon(agent.status)}
                  </text>
                  <text fg={theme.text}>{agent.name}</text>
                  <Show when={agent.status === "running"}>
                    <text fg={theme.textMuted}>...</text>
                  </Show>
                  <Show when={agent.status === "complete"}>
                    <text fg={theme.success}>✓</text>
                  </Show>
                  <Show when={agent.status === "error"}>
                    <text fg={theme.error}>failed</text>
                  </Show>
                </box>
              )}
            </For>
          </box>
        </box>
      </Show>

      {/* Results Step */}
      <Show when={step() === "results"}>
        <box flexDirection="column" gap={1}>
          {/* Summary */}
          <box flexDirection="row" gap={3}>
            <Show when={issuesSummary().critical > 0}>
              <text fg={theme.error}>
                {issuesSummary().critical} critical
              </text>
            </Show>
            <Show when={issuesSummary().warning > 0}>
              <text fg={theme.warning}>
                {issuesSummary().warning} warnings
              </text>
            </Show>
            <Show when={issuesSummary().suggestion > 0}>
              <text fg={theme.primary}>
                {issuesSummary().suggestion} suggestions
              </text>
            </Show>
            <Show when={allIssues().length === 0}>
              <text fg={theme.success}>No issues found!</text>
            </Show>
          </box>

          {/* Agent Summaries */}
          <box marginTop={1} flexDirection="column">
            <For each={enabledAgents()}>
              {(agent) => (
                <box flexDirection="column" marginBottom={1}>
                  <text fg={theme.text} attributes={TextAttributes.BOLD}>
                    {agent.name}:
                  </text>
                  <text fg={theme.textMuted}>{agent.result || "No summary"}</text>
                </box>
              )}
            </For>
          </box>

          {/* Issues List */}
          <Show when={allIssues().length > 0}>
            <box marginTop={1} flexDirection="column">
              <text fg={theme.text} attributes={TextAttributes.BOLD}>
                Issues:
              </text>
              <For each={allIssues().slice(0, 10)}>
                {(issue) => (
                  <box flexDirection="column" marginTop={1}>
                    <box flexDirection="row" gap={1}>
                      <text fg={severityColor(issue.severity)}>
                        [{severityIcon(issue.severity)}]
                      </text>
                      <text fg={theme.text}>{issue.title}</text>
                      <Show when={issue.file}>
                        <text fg={theme.textMuted}>
                          ({issue.file}
                          {issue.line ? `:${issue.line}` : ""})
                        </text>
                      </Show>
                    </box>
                    <text fg={theme.textMuted}>    {issue.description.slice(0, 100)}</text>
                  </box>
                )}
              </For>
              <Show when={allIssues().length > 10}>
                <text fg={theme.textMuted} marginTop={1}>
                  ... and {allIssues().length - 10} more issues
                </text>
              </Show>
            </box>
          </Show>

          <box marginTop={1} flexDirection="row">
            <box paddingLeft={3} paddingRight={3} backgroundColor={theme.primary} onMouseUp={() => dialog.clear()}>
              <text fg={theme.selectedListItemText}>Done</text>
            </box>
          </box>
        </box>
      </Show>
    </box>
  )
}
