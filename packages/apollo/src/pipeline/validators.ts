/**
 * Pipeline Checkpoint Validators
 * Validates state at each pipeline step before advancing
 */

import { SlidePipeline } from "./slide-pipeline"
import { hasPlaceholders, detectPlaceholders } from "../util/placeholder-detector"

export namespace PipelineValidators {
  export interface ValidationResult {
    valid: boolean
    errors: string[]
  }

  /**
   * Checkpoint 1: Validate presentation context
   */
  export function validateContext(ctx: SlidePipeline.PresentationContext): ValidationResult {
    const errors: string[] = []

    if (!ctx.topic || ctx.topic.length < 3) {
      errors.push("Topic must be at least 3 characters")
    }
    if (!ctx.thesis || ctx.thesis.length < 10) {
      errors.push("Thesis must be at least 10 characters")
    }
    if (ctx.thesis && ctx.thesis.length > 100) {
      errors.push("Thesis must be under 100 characters")
    }
    if (hasPlaceholders(ctx.topic) || hasPlaceholders(ctx.thesis)) {
      errors.push("Context contains placeholder text - use real data only")
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Checkpoint 2: Validate research data
   */
  export function validateResearch(data: SlidePipeline.ResearchData): ValidationResult {
    const errors: string[] = []

    if (!data.hook_stat?.value) {
      errors.push("Missing hook statistic - need a compelling opening fact")
    }
    if (!data.hook_stat?.source) {
      errors.push("Hook statistic missing source citation")
    }
    if (data.supporting_facts.length < 3) {
      errors.push(`Insufficient facts: ${data.supporting_facts.length}/3 minimum required`)
    }

    // Check for placeholders in all research data
    const allText = JSON.stringify(data)
    if (hasPlaceholders(allText)) {
      const found = detectPlaceholders(allText)
      errors.push(`Research contains placeholders: ${found.join(', ')}`)
    }

    // Check each fact has a source
    const missingSource = data.supporting_facts.filter(f => !f.source)
    if (missingSource.length > 0) {
      errors.push(`${missingSource.length} fact(s) missing source citations`)
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Checkpoint 3: Validate slide outline
   */
  export function validateOutline(outline: SlidePipeline.SlideOutline): ValidationResult {
    const errors: string[] = []

    if (outline.headlines.length !== 7) {
      errors.push(`Expected 7 slides, got ${outline.headlines.length}`)
    }

    // Validate each headline
    outline.headlines.forEach(h => {
      if (h.character_count > 60) {
        errors.push(`Slide ${h.slide} headline too long: ${h.character_count}/60 chars max`)
      }
      if (hasPlaceholders(h.headline)) {
        errors.push(`Slide ${h.slide} headline contains placeholder text`)
      }
      if (!h.headline || h.headline.length < 5) {
        errors.push(`Slide ${h.slide} headline too short`)
      }
    })

    // Story test validation
    if (!outline.story_test || outline.story_test.length < 20) {
      errors.push("Story test summary missing or too brief")
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Checkpoint 4: Validate built HTML slides
   */
  export function validateBuild(slides: SlidePipeline.SlideHTML[]): ValidationResult {
    const errors: string[] = []

    if (slides.length < 7) {
      errors.push(`Expected 7 slides, got ${slides.length}`)
    }

    slides.forEach(slide => {
      // Check for placeholders
      if (hasPlaceholders(slide.html)) {
        const found = detectPlaceholders(slide.html)
        errors.push(`Slide ${slide.id} contains placeholders: ${found.join(', ')}`)
      }

      // Check structure
      if (!slide.html.includes('slide-content')) {
        errors.push(`Slide ${slide.id} missing slide-content wrapper`)
      }

      // Check for empty content
      if (slide.html.length < 100) {
        errors.push(`Slide ${slide.id} appears to have insufficient content`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  /**
   * Checkpoint 5: Final verification
   */
  export function validateFinal(report: SlidePipeline.ValidationReport): ValidationResult {
    const failedChecks = report.checks.filter(c => !c.passed)
    return {
      valid: report.passed && failedChecks.length === 0,
      errors: failedChecks.flatMap(c => c.issues)
    }
  }

  /**
   * Run all validators on a complete state
   */
  export function validateState(state: SlidePipeline.State): ValidationResult {
    const allErrors: string[] = []

    if (state.context) {
      const ctx = validateContext(state.context)
      if (!ctx.valid) allErrors.push(...ctx.errors.map(e => `[Context] ${e}`))
    }

    if (state.research) {
      const res = validateResearch(state.research)
      if (!res.valid) allErrors.push(...res.errors.map(e => `[Research] ${e}`))
    }

    if (state.outline) {
      const out = validateOutline(state.outline)
      if (!out.valid) allErrors.push(...out.errors.map(e => `[Outline] ${e}`))
    }

    if (state.slides) {
      const bld = validateBuild(state.slides)
      if (!bld.valid) allErrors.push(...bld.errors.map(e => `[Build] ${e}`))
    }

    return { valid: allErrors.length === 0, errors: allErrors }
  }
}
