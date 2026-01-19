#!/usr/bin/env bun
/**
 * Test script for the slide generation pipeline
 * Run: bun packages/apollo/src/pipeline/test-pipeline.ts
 */

import { SlidePipeline } from "./slide-pipeline"
import { PipelineValidators } from "./validators"
import { executeUnderstand } from "./steps/understand"
import { executeOutline } from "./steps/outline"
import { executeBuild, wrapInDocument } from "./steps/build"
import { executeVerify } from "./steps/verify"

// Color helpers for terminal output
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

console.log(bold("\n🚀 Slide Generation Pipeline Test\n"))
console.log("=" .repeat(50))

// Step 1: Create pipeline state
console.log(cyan("\n📋 Step 1: UNDERSTAND"))
const state = SlidePipeline.create("test-session-001")
console.log(`   Session ID: ${state.sessionID}`)
console.log(`   Initial step: ${state.step}`)

// Test user request
const userRequest = "Create a presentation about sustainable energy for investors"
console.log(`   User request: "${userRequest}"`)

const understandResult = executeUnderstand({ userRequest })
state.context = understandResult.context

console.log(`   ${green("✓")} Topic: ${state.context.topic}`)
console.log(`   ${green("✓")} Audience: ${state.context.audience}`)
console.log(`   ${green("✓")} Goal: ${state.context.goal}`)
console.log(`   ${green("✓")} Narrative: ${state.context.narrative_type}`)

// Validate context
const ctxValidation = PipelineValidators.validateContext(state.context)
if (ctxValidation.valid) {
  console.log(`   ${green("✓")} Context validation passed`)
} else {
  console.log(`   ${red("✗")} Context validation failed:`)
  ctxValidation.errors.forEach(e => console.log(`      - ${e}`))
}

// Step 2: Research (simulated - requires real web search)
console.log(cyan("\n🔍 Step 2: RESEARCH"))
console.log(`   ${yellow("⚠")} Skipped - requires WebSearch integration`)
console.log(`   Using mock research data for demo...`)

// Add mock research for testing
state.research = {
  hook_stat: {
    value: "$1.5 trillion",
    description: "Global investment in clean energy reached $1.5 trillion in 2024",
    source: "International Energy Agency",
    source_url: "https://www.iea.org/reports/world-energy-investment-2024"
  },
  supporting_facts: [
    { fact: "Solar power costs have dropped 89% since 2010", source: "IRENA", source_url: "https://irena.org" },
    { fact: "Renewable energy now accounts for 30% of global electricity", source: "BloombergNEF", source_url: "https://bnef.com" },
    { fact: "Electric vehicle sales grew 35% year-over-year in 2024", source: "IEA", source_url: "https://iea.org" },
  ],
  case_studies: [
    { title: "Denmark's Wind Energy Success", description: "Denmark generates 80% of electricity from wind", source: "https://energy.gov" }
  ],
  research_gaps: []
}
console.log(`   ${green("✓")} Research data loaded`)

// Step 3: Outline
console.log(cyan("\n📝 Step 3: OUTLINE"))
const outlineResult = executeOutline({
  context: state.context,
  research: state.research
})
state.outline = outlineResult.outline

console.log(`   ${green("✓")} Generated ${state.outline.headlines.length} slide headlines:`)
state.outline.headlines.forEach((h, i) => {
  const charStatus = h.character_count <= 60 ? green("✓") : red("✗")
  console.log(`      ${i+1}. [${h.type}] ${h.headline} (${charStatus} ${h.character_count}/60 chars)`)
})

// Validate outline
const outlineValidation = PipelineValidators.validateOutline(state.outline)
if (outlineValidation.valid) {
  console.log(`   ${green("✓")} Outline validation passed`)
} else {
  console.log(`   ${red("✗")} Outline validation failed:`)
  outlineValidation.errors.forEach(e => console.log(`      - ${e}`))
}

// Step 4: Design (implicit in build)
console.log(cyan("\n🎨 Step 4: DESIGN"))
console.log(`   ${green("✓")} Using default theme (black/white minimalist)`)

// Step 5: Build
console.log(cyan("\n🔨 Step 5: BUILD"))
const buildResult = executeBuild({
  context: state.context,
  research: state.research,
  outline: state.outline
})
state.slides = buildResult.slides

console.log(`   ${green("✓")} Built ${state.slides.length} HTML slides`)
state.slides.forEach(slide => {
  const size = slide.html.length
  console.log(`      - Slide ${slide.id} (${slide.type}): ${size} bytes`)
})

// Step 6: Verify
console.log(cyan("\n✅ Step 6: VERIFY"))
const verifyResult = executeVerify({ slides: state.slides })
state.validation = verifyResult.report

console.log(`   ${verifyResult.report.passed ? green("✓") : red("✗")} ${verifyResult.summary}`)
verifyResult.report.checks.forEach(check => {
  const icon = check.passed ? green("✓") : red("✗")
  console.log(`      ${icon} ${check.check}`)
  if (!check.passed) {
    check.issues.forEach(issue => console.log(`         - ${issue}`))
  }
})

// Step 7: Deliver
console.log(cyan("\n📦 Step 7: DELIVER"))
const fullDocument = wrapInDocument(state.context.topic, state.slides)
const outputPath = "/tmp/test-presentation.html"

await Bun.write(outputPath, fullDocument)
console.log(`   ${green("✓")} Saved presentation to: ${outputPath}`)
console.log(`   ${green("✓")} Total document size: ${fullDocument.length.toLocaleString()} bytes`)

// Final summary
console.log("\n" + "=".repeat(50))
console.log(bold("📊 Pipeline Summary\n"))

const finalValidation = PipelineValidators.validateState(state)
if (finalValidation.valid) {
  console.log(green("✓ All pipeline stages completed successfully!"))
} else {
  console.log(red("✗ Pipeline completed with errors:"))
  finalValidation.errors.forEach(e => console.log(`   - ${e}`))
}

console.log(`\n${cyan("→")} Open the presentation: ${bold(`open ${outputPath}`)}\n`)
