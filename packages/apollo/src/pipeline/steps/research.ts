/**
 * Step 2: RESEARCH
 * Gather facts and data for the presentation
 * CRITICAL: No placeholders - only real, verified data
 */

import { SlidePipeline } from "../slide-pipeline"

export interface ResearchInput {
  context: SlidePipeline.PresentationContext
  searchResults?: SearchResult[]
}

export interface SearchResult {
  query: string
  results: Array<{
    title: string
    snippet: string
    url: string
  }>
}

export interface ResearchOutput {
  research: SlidePipeline.ResearchData
  queries: string[]
  gaps: string[]
}

/**
 * Generate research queries based on topic
 */
export function generateQueries(context: SlidePipeline.PresentationContext): string[] {
  const { topic, audience, goal } = context
  const queries: string[] = []

  // Hook statistic query
  queries.push(`${topic} statistics 2024 2025`)

  // Market/scope query
  if (goal === 'raise_money' || goal === 'sell') {
    queries.push(`${topic} market size TAM SAM SOM`)
  }

  // Supporting facts
  queries.push(`${topic} facts research study`)
  queries.push(`${topic} trends insights`)

  // Case studies
  queries.push(`${topic} case study example success`)

  // Audience-specific
  if (audience === 'investors') {
    queries.push(`${topic} investment growth potential`)
  } else if (audience === 'students') {
    queries.push(`${topic} introduction overview basics`)
  }

  return queries
}

/**
 * Process search results into research data
 */
export function processSearchResults(
  context: SlidePipeline.PresentationContext,
  searchResults: SearchResult[]
): ResearchOutput {
  const gaps: string[] = []
  const queries = searchResults.map(r => r.query)

  // Initialize empty research
  const research: SlidePipeline.ResearchData = {
    supporting_facts: [],
    case_studies: [],
    research_gaps: []
  }

  // Process each search result
  for (const result of searchResults) {
    if (result.results.length === 0) {
      gaps.push(`No results for: ${result.query}`)
      continue
    }

    for (const item of result.results) {
      // Look for statistics in snippets
      const statMatch = item.snippet.match(/(\d+(?:\.\d+)?%|\$[\d.]+[BMK]?|\d+(?:,\d{3})*)/g)

      if (statMatch && !research.hook_stat) {
        research.hook_stat = {
          value: statMatch[0],
          description: item.snippet.slice(0, 100),
          source: item.title,
          source_url: item.url
        }
      }

      // Add to supporting facts
      if (research.supporting_facts.length < 5) {
        research.supporting_facts.push({
          fact: item.snippet.slice(0, 150),
          source: item.title,
          source_url: item.url
        })
      }

      // Look for case studies
      if (item.title.toLowerCase().includes('case study') ||
          item.snippet.toLowerCase().includes('example')) {
        if (research.case_studies.length < 2) {
          research.case_studies.push({
            title: item.title,
            description: item.snippet.slice(0, 200),
            source: item.url
          })
        }
      }
    }
  }

  // Track gaps
  if (!research.hook_stat) {
    gaps.push("Could not find compelling hook statistic")
  }
  if (research.supporting_facts.length < 3) {
    gaps.push(`Only found ${research.supporting_facts.length}/3 required facts`)
  }

  research.research_gaps = gaps

  return { research, queries, gaps }
}

/**
 * Execute research step (requires external search integration)
 */
export function executeResearch(input: ResearchInput): ResearchOutput {
  const { context, searchResults } = input

  if (!searchResults || searchResults.length === 0) {
    // Return template for what needs to be searched
    return {
      research: {
        supporting_facts: [],
        case_studies: [],
        research_gaps: ['No search results provided - external search required']
      },
      queries: generateQueries(context),
      gaps: ['Research step requires websearch tool integration']
    }
  }

  return processSearchResults(context, searchResults)
}
