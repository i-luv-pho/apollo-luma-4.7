/**
 * Step 1: UNDERSTAND
 * Parse user request and extract presentation context
 */

import { SlidePipeline } from "../slide-pipeline"

export interface UnderstandInput {
  userRequest: string
}

export interface UnderstandOutput {
  context: SlidePipeline.PresentationContext
  inferred: string[]
}

/**
 * Infer audience from request keywords
 */
function inferAudience(text: string): SlidePipeline.PresentationContext['audience'] {
  const lower = text.toLowerCase()
  if (lower.includes('investor') || lower.includes('funding') || lower.includes('pitch')) return 'investors'
  if (lower.includes('executive') || lower.includes('board') || lower.includes('leadership')) return 'executives'
  if (lower.includes('student') || lower.includes('class') || lower.includes('course')) return 'students'
  if (lower.includes('customer') || lower.includes('client') || lower.includes('sales')) return 'customers'
  return 'general'
}

/**
 * Infer goal from request keywords
 */
function inferGoal(text: string): SlidePipeline.PresentationContext['goal'] {
  const lower = text.toLowerCase()
  if (lower.includes('raise') || lower.includes('funding') || lower.includes('invest')) return 'raise_money'
  if (lower.includes('approval') || lower.includes('buy-in') || lower.includes('convince')) return 'get_buyin'
  if (lower.includes('teach') || lower.includes('learn') || lower.includes('explain')) return 'educate'
  if (lower.includes('sell') || lower.includes('purchase') || lower.includes('buy')) return 'sell'
  return 'inform'
}

/**
 * Infer narrative type from goal
 */
function inferNarrative(goal: SlidePipeline.PresentationContext['goal']): SlidePipeline.PresentationContext['narrative_type'] {
  switch (goal) {
    case 'raise_money':
    case 'sell':
      return 'problem_solution'
    case 'get_buyin':
      return 'situation_complication_resolution'
    case 'educate':
    case 'inform':
    default:
      return 'pain_dream_fix'
  }
}

/**
 * Extract topic from request
 */
function extractTopic(text: string): string {
  // Remove common prefixes
  let topic = text
    .replace(/^(create|make|build|generate|design)\s+(a\s+)?(presentation|deck|slides?)\s+(about|on|for)\s+/i, '')
    .replace(/^(i\s+need|i\s+want|please)\s+/i, '')
    .trim()

  // Capitalize first letter
  return topic.charAt(0).toUpperCase() + topic.slice(1)
}

/**
 * Execute the understand step
 */
export function executeUnderstand(input: UnderstandInput): UnderstandOutput {
  const { userRequest } = input
  const inferred: string[] = []

  const topic = extractTopic(userRequest)
  const audience = inferAudience(userRequest)
  const goal = inferGoal(userRequest)
  const narrative_type = inferNarrative(goal)

  inferred.push(`Inferred audience: ${audience}`)
  inferred.push(`Inferred goal: ${goal}`)
  inferred.push(`Inferred narrative: ${narrative_type}`)

  const context: SlidePipeline.PresentationContext = {
    topic,
    audience,
    goal,
    thesis: `Key insights about ${topic}`, // Will be refined in research phase
    narrative_type,
    slide_count: 7,
    tone: audience === 'students' ? 'academic' : audience === 'investors' ? 'professional' : 'conversational'
  }

  return { context, inferred }
}
