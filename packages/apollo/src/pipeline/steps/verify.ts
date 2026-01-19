/**
 * Step 6: VERIFY
 * Validate generated slides against quality standards
 */

import { SlidePipeline } from "../slide-pipeline"
import { detectPlaceholders, hasPlaceholders } from "../../util/placeholder-detector"

export interface VerifyInput {
  slides: SlidePipeline.SlideHTML[]
}

export interface VerifyOutput {
  report: SlidePipeline.ValidationReport
  summary: string
}

interface Check {
  name: string
  description: string
  validate: (slides: SlidePipeline.SlideHTML[]) => { passed: boolean; issues: string[] }
}

/**
 * All quality checks to run
 */
const CHECKS: Check[] = [
  {
    name: 'placeholders',
    description: 'No placeholder text ([brackets], TBD, TODO)',
    validate: (slides) => {
      const issues: string[] = []
      for (const slide of slides) {
        if (hasPlaceholders(slide.html)) {
          const found = detectPlaceholders(slide.html)
          issues.push(`Slide ${slide.id}: Found placeholders: ${found.join(', ')}`)
        }
      }
      return { passed: issues.length === 0, issues }
    }
  },
  {
    name: 'slide_count',
    description: 'Exactly 7 slides present',
    validate: (slides) => {
      const passed = slides.length === 7
      return {
        passed,
        issues: passed ? [] : [`Expected 7 slides, found ${slides.length}`]
      }
    }
  },
  {
    name: 'structure',
    description: 'Each slide has proper HTML structure',
    validate: (slides) => {
      const issues: string[] = []
      for (const slide of slides) {
        if (!slide.html.includes('class="slide"')) {
          issues.push(`Slide ${slide.id}: Missing .slide class`)
        }
        if (!slide.html.includes('slide-content')) {
          issues.push(`Slide ${slide.id}: Missing .slide-content wrapper`)
        }
      }
      return { passed: issues.length === 0, issues }
    }
  },
  {
    name: 'content_length',
    description: 'Slides have sufficient content',
    validate: (slides) => {
      const issues: string[] = []
      for (const slide of slides) {
        // Strip HTML tags to check text content
        const textOnly = slide.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        if (textOnly.length < 20) {
          issues.push(`Slide ${slide.id}: Insufficient content (${textOnly.length} chars)`)
        }
      }
      return { passed: issues.length === 0, issues }
    }
  },
  {
    name: 'empty_elements',
    description: 'No empty headings or paragraphs',
    validate: (slides) => {
      const issues: string[] = []
      const emptyPatterns = [
        /<h[1-6][^>]*>\s*<\/h[1-6]>/gi,
        /<p[^>]*>\s*<\/p>/gi,
        /<li[^>]*>\s*<\/li>/gi
      ]
      for (const slide of slides) {
        for (const pattern of emptyPatterns) {
          if (pattern.test(slide.html)) {
            issues.push(`Slide ${slide.id}: Contains empty elements`)
            break
          }
        }
      }
      return { passed: issues.length === 0, issues }
    }
  },
  {
    name: 'sources',
    description: 'Data slides have source citations',
    validate: (slides) => {
      const issues: string[] = []
      const dataSlideTypes = ['problem', 'market', 'impact']
      for (const slide of slides) {
        if (dataSlideTypes.includes(slide.type)) {
          // Check if slide has data (numbers, statistics)
          const hasData = /\d+%|\$\d|statistic/i.test(slide.html)
          const hasSource = slide.html.includes('class="sources"') ||
                           slide.html.includes('Source:')
          if (hasData && !hasSource) {
            issues.push(`Slide ${slide.id} (${slide.type}): Has data but missing source citation`)
          }
        }
      }
      return { passed: issues.length === 0, issues }
    }
  },
  {
    name: 'accessibility',
    description: 'Basic accessibility requirements',
    validate: (slides) => {
      const issues: string[] = []
      for (const slide of slides) {
        // Check for heading hierarchy
        const hasH1 = slide.html.includes('<h1')
        const hasH2 = slide.html.includes('<h2')
        if (!hasH1 && !hasH2) {
          issues.push(`Slide ${slide.id}: Missing heading (h1 or h2)`)
        }
      }
      return { passed: issues.length === 0, issues }
    }
  }
]

/**
 * Execute verification step
 */
export function executeVerify(input: VerifyInput): VerifyOutput {
  const { slides } = input

  const checks = CHECKS.map(check => {
    const result = check.validate(slides)
    return {
      check: check.name,
      passed: result.passed,
      issues: result.issues
    }
  })

  const allPassed = checks.every(c => c.passed)
  const totalIssues = checks.reduce((sum, c) => sum + c.issues.length, 0)
  const failedChecks = checks.filter(c => !c.passed)

  const report: SlidePipeline.ValidationReport = {
    passed: allPassed,
    checks,
    remediation_required: failedChecks.map(c => c.check)
  }

  const summary = allPassed
    ? `✓ All ${checks.length} quality checks passed`
    : `✗ ${failedChecks.length}/${checks.length} checks failed with ${totalIssues} issues`

  return { report, summary }
}

/**
 * Get detailed remediation steps for failed checks
 */
export function getRemediationSteps(report: SlidePipeline.ValidationReport): string[] {
  const steps: string[] = []

  for (const check of report.checks) {
    if (!check.passed) {
      switch (check.check) {
        case 'placeholders':
          steps.push('Replace all placeholder text with real content')
          steps.push('Use websearch to find actual data for [brackets] text')
          break
        case 'slide_count':
          steps.push('Ensure exactly 7 slides are generated')
          break
        case 'structure':
          steps.push('Verify each slide has .slide and .slide-content classes')
          break
        case 'content_length':
          steps.push('Add more content to sparse slides')
          break
        case 'sources':
          steps.push('Add source citations for all statistics and data')
          break
        default:
          steps.push(`Fix issues in ${check.check}: ${check.issues.join('; ')}`)
      }
    }
  }

  return steps
}
