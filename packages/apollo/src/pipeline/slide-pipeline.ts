import { z } from "zod"

export namespace SlidePipeline {
  export type Step = 'understand' | 'research' | 'outline' | 'design' | 'build' | 'verify' | 'deliver'

  export const PresentationContext = z.object({
    topic: z.string(),
    audience: z.enum(['investors', 'executives', 'students', 'customers', 'general']),
    goal: z.enum(['raise_money', 'get_buyin', 'educate', 'sell', 'inform']),
    thesis: z.string().max(100),
    narrative_type: z.enum(['problem_solution', 'situation_complication_resolution', 'pain_dream_fix']),
    slide_count: z.number().default(7),
    tone: z.enum(['professional', 'academic', 'conversational'])
  })
  export type PresentationContext = z.infer<typeof PresentationContext>

  export const ResearchData = z.object({
    hook_stat: z.object({
      value: z.string(),
      description: z.string(),
      source: z.string(),
      source_url: z.string().optional()
    }).optional(),
    supporting_facts: z.array(z.object({
      fact: z.string(),
      source: z.string(),
      source_url: z.string().optional()
    })),
    case_studies: z.array(z.object({
      title: z.string(),
      description: z.string(),
      source: z.string().optional()
    })),
    research_gaps: z.array(z.string()).optional()
  })
  export type ResearchData = z.infer<typeof ResearchData>

  export const SlideOutline = z.object({
    headlines: z.array(z.object({
      slide: z.number(),
      type: z.enum(['title', 'problem', 'solution', 'how', 'market', 'impact', 'cta']),
      headline: z.string().max(60),
      character_count: z.number()
    })),
    story_test: z.string()
  })
  export type SlideOutline = z.infer<typeof SlideOutline>

  export const SlideHTML = z.object({
    id: z.number(),
    type: z.string(),
    html: z.string()
  })
  export type SlideHTML = z.infer<typeof SlideHTML>

  export const ValidationReport = z.object({
    passed: z.boolean(),
    checks: z.array(z.object({
      check: z.string(),
      passed: z.boolean(),
      issues: z.array(z.string())
    })),
    remediation_required: z.array(z.string()).optional()
  })
  export type ValidationReport = z.infer<typeof ValidationReport>

  export interface State {
    sessionID: string
    step: Step
    context?: PresentationContext
    research?: ResearchData
    outline?: SlideOutline
    slides?: SlideHTML[]
    validation?: ValidationReport
    retryCount: number
    errors: string[]
  }

  export function create(sessionID: string): State {
    return {
      sessionID,
      step: 'understand',
      retryCount: 0,
      errors: []
    }
  }

  export function canAdvance(state: State): boolean {
    switch (state.step) {
      case 'understand': return !!state.context
      case 'research': return !!state.research && state.research.supporting_facts.length >= 3
      case 'outline': return !!state.outline && state.outline.headlines.length === 7
      case 'design': return true
      case 'build': return !!state.slides && state.slides.length > 0
      case 'verify': return !!state.validation && state.validation.passed
      case 'deliver': return true
      default: return false
    }
  }

  export function nextStep(current: Step): Step | null {
    const steps: Step[] = ['understand', 'research', 'outline', 'design', 'build', 'verify', 'deliver']
    const idx = steps.indexOf(current)
    return idx < steps.length - 1 ? steps[idx + 1] : null
  }

  export function advance(state: State): State {
    if (!canAdvance(state)) {
      return { ...state, errors: [...state.errors, `Cannot advance from ${state.step}: validation failed`] }
    }
    const next = nextStep(state.step)
    if (!next) return state
    return { ...state, step: next }
  }
}
