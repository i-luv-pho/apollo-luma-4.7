import { TextAttributes } from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import { useTheme } from "../context/theme"
import { useDialog } from "../ui/dialog"
import { useToast } from "../ui/toast"
import { createSignal, createMemo, Show, For, onMount } from "solid-js"
import open from "open"
import { $ } from "bun"

type Step = "detect" | "install" | "provider" | "workflow" | "complete"

interface RepoInfo {
  owner: string
  repo: string
  found: boolean
  error?: string
}

interface ProviderOption {
  id: string
  name: string
  recommended?: boolean
}

const PROVIDERS: ProviderOption[] = [
  { id: "apollo", name: "Apollo", recommended: true },
  { id: "anthropic", name: "Anthropic" },
  { id: "openai", name: "OpenAI" },
  { id: "google", name: "Google" },
  { id: "amazon-bedrock", name: "Amazon Bedrock" },
]

const GITHUB_APP_URL = "https://github.com/apps/apollo-agent"
const WORKFLOW_FILE = ".github/workflows/apollo.yml"

function parseGitHubRemote(url: string): { owner: string; repo: string } | null {
  const match = url.match(/^(?:(?:https?|ssh):\/\/)?(?:git@)?github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/)
  if (!match) return null
  return { owner: match[1], repo: match[2] }
}

export function DialogGitHubInstall() {
  const dialog = useDialog()
  const { theme } = useTheme()
  const toast = useToast()

  const [step, setStep] = createSignal<Step>("detect")
  const [repoInfo, setRepoInfo] = createSignal<RepoInfo>({ owner: "", repo: "", found: false })
  const [selectedProvider, setSelectedProvider] = createSignal(0)
  const [installing, setInstalling] = createSignal(false)
  const [workflowCreated, setWorkflowCreated] = createSignal(false)

  // Detect repository on mount
  onMount(async () => {
    try {
      const remoteUrl = (await $`git remote get-url origin`.quiet().nothrow().text()).trim()
      const parsed = parseGitHubRemote(remoteUrl)
      if (parsed) {
        setRepoInfo({ ...parsed, found: true })
        setStep("install")
      } else {
        setRepoInfo({
          owner: "",
          repo: "",
          found: false,
          error: "Could not detect GitHub repository. Make sure you're in a git repository with a GitHub remote.",
        })
      }
    } catch {
      setRepoInfo({
        owner: "",
        repo: "",
        found: false,
        error: "Could not detect GitHub repository.",
      })
    }
  })

  const currentProvider = createMemo(() => PROVIDERS[selectedProvider()])

  useKeyboard((evt) => {
    if (evt.name === "escape") {
      dialog.clear()
      return
    }

    const currentStep = step()

    if (currentStep === "detect" && !repoInfo().found) {
      // Can't proceed without repo
      return
    }

    if (currentStep === "install") {
      if (evt.name === "return" || evt.name === "i") {
        handleInstallApp()
      } else if (evt.name === "s") {
        // Skip to provider selection
        setStep("provider")
      }
      return
    }

    if (currentStep === "provider") {
      if (evt.name === "up" || evt.name === "k") {
        setSelectedProvider((i) => Math.max(0, i - 1))
      } else if (evt.name === "down" || evt.name === "j") {
        setSelectedProvider((i) => Math.min(PROVIDERS.length - 1, i + 1))
      } else if (evt.name === "return") {
        setStep("workflow")
      }
      return
    }

    if (currentStep === "workflow") {
      if (evt.name === "return" || evt.name === "c") {
        handleCreateWorkflow()
      } else if (evt.name === "s") {
        setStep("complete")
      }
      return
    }

    if (currentStep === "complete") {
      if (evt.name === "return") {
        dialog.clear()
      }
    }
  })

  const handleInstallApp = async () => {
    setInstalling(true)
    try {
      await open(GITHUB_APP_URL)
      toast.show({
        variant: "info",
        message: "Opening GitHub to install app...",
        duration: 3000,
      })
      // Move to next step after a delay to give user time to install
      setTimeout(() => {
        setInstalling(false)
        setStep("provider")
      }, 2000)
    } catch {
      toast.show({
        variant: "error",
        message: `Could not open browser. Visit: ${GITHUB_APP_URL}`,
        duration: 5000,
      })
      setInstalling(false)
    }
  }

  const handleCreateWorkflow = async () => {
    const provider = currentProvider()
    const envVars = provider.id === "amazon-bedrock" ? [] : getEnvVarsForProvider(provider.id)

    const envStr =
      provider.id === "amazon-bedrock"
        ? ""
        : `\n        env:${envVars.map((e) => `\n          ${e}: \${{ secrets.${e} }}`).join("")}`

    const workflowContent = `name: apollo

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  apollo:
    if: |
      contains(github.event.comment.body, ' /apollo') ||
      startsWith(github.event.comment.body, '/apollo')
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      pull-requests: read
      issues: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          persist-credentials: false

      - name: Run apollo
        uses: i-luv-pho/apollov2/github@latest${envStr}
        with:
          model: ${provider.id}/claude-sonnet-4-20250514`

    try {
      const fs = await import("fs")
      const path = await import("path")

      // Create .github/workflows directory if it doesn't exist
      const workflowDir = path.join(process.cwd(), ".github/workflows")
      await fs.promises.mkdir(workflowDir, { recursive: true })

      // Write the workflow file
      const workflowPath = path.join(process.cwd(), WORKFLOW_FILE)
      await fs.promises.writeFile(workflowPath, workflowContent)

      setWorkflowCreated(true)
      toast.show({
        variant: "success",
        message: `Created ${WORKFLOW_FILE}`,
        duration: 3000,
      })
      setStep("complete")
    } catch (e) {
      toast.show({
        variant: "error",
        message: `Failed to create workflow: ${e}`,
        duration: 5000,
      })
    }
  }

  function getEnvVarsForProvider(providerId: string): string[] {
    switch (providerId) {
      case "apollo":
        return ["APOLLO_API_KEY"]
      case "anthropic":
        return ["ANTHROPIC_API_KEY"]
      case "openai":
        return ["OPENAI_API_KEY"]
      case "google":
        return ["GOOGLE_API_KEY"]
      default:
        return []
    }
  }

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} flexDirection="column" paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          Install GitHub Agent
        </text>
        <text fg={theme.textMuted}>esc to close</text>
      </box>

      {/* Step: Detect Repository */}
      <Show when={step() === "detect"}>
        <Show when={repoInfo().error}>
          <text fg={theme.error}>{repoInfo().error}</text>
          <text fg={theme.textMuted}>
            Please run this command from within a git repository that has a GitHub remote.
          </text>
        </Show>
        <Show when={!repoInfo().error && !repoInfo().found}>
          <text fg={theme.textMuted}>Detecting repository...</text>
        </Show>
      </Show>

      {/* Step: Install App */}
      <Show when={step() === "install"}>
        <box flexDirection="column" gap={1}>
          <text fg={theme.text}>
            Repository: <span style={{ fg: theme.primary }}>{repoInfo().owner}/{repoInfo().repo}</span>
          </text>

          <box marginTop={1}>
            <text fg={theme.text}>Install the Apollo GitHub App to enable CI/CD integration.</text>
          </box>

          <box marginTop={1} flexDirection="column">
            <text fg={theme.textMuted}>The app will:</text>
            <text fg={theme.textMuted}>  • Respond to /apollo mentions in issues and PRs</text>
            <text fg={theme.textMuted}>  • Auto-review pull requests</text>
            <text fg={theme.textMuted}>  • Create PRs from issue comments</text>
          </box>

          <box marginTop={1} flexDirection="row" gap={2}>
            <box
              paddingLeft={2}
              paddingRight={2}
              backgroundColor={installing() ? theme.textMuted : theme.primary}
              onMouseUp={handleInstallApp}
            >
              <text fg={theme.selectedListItemText}>[I] Install App</text>
            </box>
            <box paddingLeft={2} paddingRight={2} backgroundColor={theme.background} onMouseUp={() => setStep("provider")}>
              <text fg={theme.textMuted}>[S] Skip (already installed)</text>
            </box>
          </box>
        </box>
      </Show>

      {/* Step: Select Provider */}
      <Show when={step() === "provider"}>
        <box flexDirection="column" gap={1}>
          <text fg={theme.text}>Select a provider for your GitHub agent:</text>

          <box marginTop={1} flexDirection="column">
            <For each={PROVIDERS}>
              {(provider, index) => (
                <box flexDirection="row" gap={1}>
                  <text fg={selectedProvider() === index() ? theme.primary : theme.textMuted}>
                    {selectedProvider() === index() ? ">" : " "}
                  </text>
                  <text fg={selectedProvider() === index() ? theme.text : theme.textMuted}>
                    {provider.name}
                    {provider.recommended ? " (recommended)" : ""}
                  </text>
                </box>
              )}
            </For>
          </box>

          <box marginTop={1}>
            <text fg={theme.textMuted}>Use ↑/↓ to select, Enter to continue</text>
          </box>
        </box>
      </Show>

      {/* Step: Create Workflow */}
      <Show when={step() === "workflow"}>
        <box flexDirection="column" gap={1}>
          <text fg={theme.text}>
            Provider: <span style={{ fg: theme.primary }}>{currentProvider().name}</span>
          </text>

          <box marginTop={1}>
            <text fg={theme.text}>Create the GitHub Actions workflow file?</text>
          </box>

          <box marginTop={1} flexDirection="column">
            <text fg={theme.textMuted}>This will create:</text>
            <text fg={theme.primary}>  {WORKFLOW_FILE}</text>
          </box>

          <Show when={currentProvider().id !== "amazon-bedrock"}>
            <box marginTop={1} flexDirection="column">
              <text fg={theme.warning}>Required secrets:</text>
              <For each={getEnvVarsForProvider(currentProvider().id)}>
                {(envVar) => <text fg={theme.textMuted}>  • {envVar}</text>}
              </For>
              <text fg={theme.textMuted}>
                Add these in: Settings → Secrets → Actions
              </text>
            </box>
          </Show>

          <box marginTop={1} flexDirection="row" gap={2}>
            <box paddingLeft={2} paddingRight={2} backgroundColor={theme.primary} onMouseUp={handleCreateWorkflow}>
              <text fg={theme.selectedListItemText}>[C] Create Workflow</text>
            </box>
            <box paddingLeft={2} paddingRight={2} backgroundColor={theme.background} onMouseUp={() => setStep("complete")}>
              <text fg={theme.textMuted}>[S] Skip</text>
            </box>
          </box>
        </box>
      </Show>

      {/* Step: Complete */}
      <Show when={step() === "complete"}>
        <box flexDirection="column" gap={1}>
          <text fg={theme.success} attributes={TextAttributes.BOLD}>
            Setup Complete!
          </text>

          <box marginTop={1} flexDirection="column">
            <text fg={theme.text}>Next steps:</text>
            <text fg={theme.textMuted}>
              1. {workflowCreated() ? "Commit and push the workflow file" : "Create workflow file manually"}
            </text>
            <Show when={currentProvider().id !== "amazon-bedrock"}>
              <text fg={theme.textMuted}>
                2. Add secrets to your repository: {getEnvVarsForProvider(currentProvider().id).join(", ")}
              </text>
            </Show>
            <text fg={theme.textMuted}>
              {currentProvider().id !== "amazon-bedrock" ? "3" : "2"}. Go to an issue and comment `/apollo summarize` to test
            </text>
          </box>

          <box marginTop={1}>
            <text fg={theme.primary}>
              Learn more: https://github.com/i-luv-pho/apollov2/docs/github/
            </text>
          </box>

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
