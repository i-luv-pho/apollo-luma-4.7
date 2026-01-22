import { createSignal, Show, createMemo } from "solid-js"
import { A } from "@solidjs/router"
import { Button } from "@apollo-ai/ui/button"
import { Icon } from "@apollo-ai/ui/icon"
import { Spinner } from "@apollo-ai/ui/spinner"
import { showToast } from "@apollo-ai/ui/toast"

// Supabase API configuration
const APOLLO_API_URL = "https://advpygqokfxmomlumkgl.supabase.co/functions/v1/generate-deck"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdnB5Z3Fva2Z4bW9tbHVta2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjY5NzMsImV4cCI6MjA4NDQwMjk3M30.2OK3fN17IkBpFJL8c1BfTfr2WtJ4exlBDikNvGw9zXg"
const MASTER_ACCESS_KEY = "sk_master_104547201485a2c890e5b4b3b48190be98bea1d8891c9196"

interface GenerateDeckResponse {
  success: boolean
  html?: string
  researchQueries?: string[]
  usage?: {
    decks_used: number
    decks_limit: number
  }
  error?: string
}

async function generateDeck(
  accessKey: string,
  topic: string,
  slides: number
): Promise<GenerateDeckResponse> {
  const response = await fetch(APOLLO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "x-access-key": accessKey
    },
    body: JSON.stringify({
      topic,
      slides,
      documentContext: "",
      assets: []
    })
  })

  const data = await response.json()

  if (!response.ok) {
    return { success: false, error: data.error || `API error: ${response.status}` }
  }

  return data
}

export default function DeckBuilder() {
  // Form state
  const [topic, setTopic] = createSignal("")
  const [slides, setSlides] = createSignal(7)
  // Use master key automatically - no user input needed
  const accessKey = () => MASTER_ACCESS_KEY

  // UI state
  const [isGenerating, setIsGenerating] = createSignal(false)
  const [generatedHtml, setGeneratedHtml] = createSignal<string | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [usage, setUsage] = createSignal<{ used: number; limit: number } | null>(null)

  // Validation
  const canGenerate = createMemo(() =>
    topic().trim().length > 0 &&
    !isGenerating()
  )

  async function handleGenerate() {
    if (!canGenerate()) return

    setIsGenerating(true)
    setError(null)
    setGeneratedHtml(null)

    try {
      const result = await generateDeck(accessKey(), topic(), slides())

      if (!result.success || !result.html) {
        setError(result.error || "Generation failed. Please try again.")
        showToast({
          title: "Generation failed",
          description: result.error || "Unknown error occurred"
        })
        return
      }

      setGeneratedHtml(result.html)

      if (result.usage) {
        setUsage({ used: result.usage.decks_used, limit: result.usage.decks_limit })
      }

      showToast({
        title: "Deck generated!",
        description: `Created ${slides()} slides for "${topic()}"`
      })

    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error"
      setError(message)
      showToast({
        title: "Error",
        description: message
      })
    } finally {
      setIsGenerating(false)
    }
  }

  function handleDownload() {
    const html = generatedHtml()
    if (!html) return

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${topic().slice(0, 30).replace(/[^a-z0-9]/gi, "-")}-deck.html`
    a.click()
    URL.revokeObjectURL(url)

    showToast({
      title: "Downloaded!",
      description: "Deck saved to your downloads folder"
    })
  }

  function handleReset() {
    setGeneratedHtml(null)
    setError(null)
  }

  return (
    <div class="min-h-screen w-full bg-slate-900 text-white">
      {/* Header */}
      <header class="border-b border-slate-800 px-6 py-4">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-4">
            <A href="/" class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <Icon name="arrow-left" size="small" />
              <span class="text-sm">Back</span>
            </A>
            <div class="h-6 w-px bg-slate-700" />
            <h1 class="text-xl font-semibold flex items-center gap-2">
              <Icon name="task" size="normal" class="text-purple-400" />
              Deck Builder
            </h1>
          </div>
          <Show when={usage()}>
            {(u) => (
              <div class="text-sm text-slate-400">
                {u().used} / {u().limit} decks used
              </div>
            )}
          </Show>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-6 py-8">
        <Show
          when={!generatedHtml()}
          fallback={
            /* Preview State */
            <div class="flex flex-col gap-6">
              {/* Preview Header */}
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-2xl font-semibold">{topic()}</h2>
                  <p class="text-slate-400 mt-1">{slides()} slides generated</p>
                </div>
                <div class="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    class="text-slate-300 hover:text-white"
                  >
                    <Icon name="plus" size="small" class="mr-2" />
                    New Deck
                  </Button>
                  <Button onClick={handleDownload} class="bg-purple-600 hover:bg-purple-500">
                    <Icon name="download" size="small" class="mr-2" />
                    Download HTML
                  </Button>
                </div>
              </div>

              {/* Preview iframe */}
              <div class="rounded-lg overflow-hidden border border-slate-700 bg-white" style={{ height: "calc(100vh - 280px)" }}>
                <iframe
                  srcdoc={generatedHtml()!}
                  class="w-full h-full"
                  title="Deck Preview"
                />
              </div>
            </div>
          }
        >
          {/* Form State */}
          <div class="max-w-2xl mx-auto">
            {/* Hero */}
            <div class="text-center mb-12">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/20 mb-6">
                <Icon name="brain" size="large" class="text-purple-400" />
              </div>
              <h2 class="text-3xl font-bold mb-3">Create AI-Powered Presentations</h2>
              <p class="text-slate-400 text-lg">
                Enter your topic and let AI generate a professional pitch deck in seconds
              </p>
            </div>

            {/* Form */}
            <div class="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
              {/* Topic */}
              <div class="mb-6">
                <label class="block text-sm font-medium text-slate-300 mb-2">
                  Presentation Topic
                </label>
                <textarea
                  value={topic()}
                  onInput={(e) => setTopic(e.currentTarget.value)}
                  placeholder="e.g., AI-powered food delivery for college students"
                  rows={3}
                  class="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Slides Count */}
              <div class="mb-8">
                <label class="block text-sm font-medium text-slate-300 mb-2">
                  Number of Slides
                </label>
                <div class="flex items-center gap-4">
                  <input
                    type="range"
                    min={3}
                    max={15}
                    value={slides()}
                    onInput={(e) => setSlides(parseInt(e.currentTarget.value))}
                    class="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span class="w-12 text-center text-lg font-medium text-purple-400">
                    {slides()}
                  </span>
                </div>
              </div>

              {/* Error message */}
              <Show when={error()}>
                <div class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <Icon name="circle-x" size="small" class="text-red-400 mt-0.5" />
                  <div>
                    <p class="text-red-400 font-medium">Generation failed</p>
                    <p class="text-red-300/80 text-sm mt-1">{error()}</p>
                  </div>
                </div>
              </Show>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate()}
                class="w-full py-4 text-lg font-medium bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              >
                <Show
                  when={!isGenerating()}
                  fallback={
                    <>
                      <Spinner class="w-5 h-5 mr-3" />
                      Generating your deck...
                    </>
                  }
                >
                  <Icon name="brain" size="small" class="mr-2" />
                  Generate Deck
                </Show>
              </Button>
            </div>

            {/* Features */}
            <div class="mt-12 grid grid-cols-3 gap-6">
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 mb-3">
                  <Icon name="chevron-double-right" size="small" class="text-emerald-400" />
                </div>
                <h3 class="font-medium mb-1">Lightning Fast</h3>
                <p class="text-sm text-slate-400">Generate decks in under 30 seconds</p>
              </div>
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20 mb-3">
                  <Icon name="magnifying-glass" size="small" class="text-blue-400" />
                </div>
                <h3 class="font-medium mb-1">AI Research</h3>
                <p class="text-sm text-slate-400">Finds real data and statistics</p>
              </div>
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/20 mb-3">
                  <Icon name="photo" size="small" class="text-amber-400" />
                </div>
                <h3 class="font-medium mb-1">Beautiful Design</h3>
                <p class="text-sm text-slate-400">Professional layouts and typography</p>
              </div>
            </div>
          </div>
        </Show>
      </main>
    </div>
  )
}
