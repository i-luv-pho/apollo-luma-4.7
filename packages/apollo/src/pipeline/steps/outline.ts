/**
 * Step 3: OUTLINE
 * Generate slide headlines that tell a complete story
 */

import { SlidePipeline } from "../slide-pipeline"

export interface OutlineInput {
  context: SlidePipeline.PresentationContext
  research: SlidePipeline.ResearchData
}

export interface OutlineOutput {
  outline: SlidePipeline.SlideOutline
  storyTest: string
}

type SlideType = 'title' | 'problem' | 'solution' | 'how' | 'market' | 'impact' | 'cta'

interface SlideTemplate {
  type: SlideType
  purpose: string
  guidelines: string[]
}

const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    type: 'title',
    purpose: 'Hook - grab attention in 5 seconds',
    guidelines: ['Use the most compelling statistic', 'Be specific, not generic', 'Max 8 words']
  },
  {
    type: 'problem',
    purpose: 'Make pain feel urgent',
    guidelines: ['Quantify the problem', 'Make it relatable', 'Create urgency']
  },
  {
    type: 'solution',
    purpose: 'Present THE answer',
    guidelines: ['One clear solution', 'Direct statement', 'Benefit-focused']
  },
  {
    type: 'how',
    purpose: 'Explain mechanism simply',
    guidelines: ['3 simple steps', 'Clear process', 'Avoid jargon']
  },
  {
    type: 'market',
    purpose: 'Show size/opportunity',
    guidelines: ['Use real numbers', 'Show growth', 'Make scale tangible']
  },
  {
    type: 'impact',
    purpose: 'Demonstrate results',
    guidelines: ['Specific outcomes', 'Before/after', 'Proof points']
  },
  {
    type: 'cta',
    purpose: 'Specific next action',
    guidelines: ['One clear action', 'Easy next step', 'Contact info']
  }
]

/**
 * Generate a headline for a slide
 */
function generateHeadline(
  template: SlideTemplate,
  context: SlidePipeline.PresentationContext,
  research: SlidePipeline.ResearchData,
  index: number
): string {
  const { topic, thesis } = context

  switch (template.type) {
    case 'title':
      if (research.hook_stat) {
        return `${research.hook_stat.value} ${research.hook_stat.description.slice(0, 40)}`
      }
      return topic

    case 'problem':
      return `The ${topic} Challenge Costs Us All`

    case 'solution':
      return `A Better Way: ${thesis.slice(0, 35)}`

    case 'how':
      return `How It Works: 3 Simple Steps`

    case 'market':
      return `The Opportunity: Growing Market`

    case 'impact':
      return `Real Results: Proven Impact`

    case 'cta':
      return `Join Us: Take the Next Step Today`

    default:
      return `Slide ${index + 1}: ${topic}`
  }
}

/**
 * Ensure headline is within character limit
 */
function enforceCharLimit(headline: string, max: number = 60): string {
  if (headline.length <= max) return headline

  // Try to cut at word boundary
  const truncated = headline.slice(0, max - 3)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > max / 2) {
    return truncated.slice(0, lastSpace) + '...'
  }

  return truncated + '...'
}

/**
 * Execute outline step
 */
export function executeOutline(input: OutlineInput): OutlineOutput {
  const { context, research } = input

  const headlines = SLIDE_TEMPLATES.map((template, index) => {
    const rawHeadline = generateHeadline(template, context, research, index)
    const headline = enforceCharLimit(rawHeadline)

    return {
      slide: index + 1,
      type: template.type,
      headline,
      character_count: headline.length
    }
  })

  // Generate story test - reading headlines alone should tell the story
  const storyTest = headlines.map(h => h.headline).join(' → ')

  const outline: SlidePipeline.SlideOutline = {
    headlines,
    story_test: storyTest
  }

  return { outline, storyTest }
}
