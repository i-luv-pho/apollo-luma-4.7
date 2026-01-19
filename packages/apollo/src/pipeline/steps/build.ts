/**
 * Step 5: BUILD
 * Generate HTML for each slide
 */

import { SlidePipeline } from "../slide-pipeline"

export interface BuildInput {
  context: SlidePipeline.PresentationContext
  research: SlidePipeline.ResearchData
  outline: SlidePipeline.SlideOutline
}

export interface BuildOutput {
  slides: SlidePipeline.SlideHTML[]
  sources: string[]
}

/**
 * CSS Design System (embedded in HTML)
 */
const DESIGN_SYSTEM = `
  :root {
    --bg: #ffffff;
    --text: #000000;
    --text-muted: #666666;
    --font-heading: 'Fraunces', serif;
    --font-body: 'Inter', sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: #f5f5f5; }
  .slide {
    width: 1280px; height: 720px;
    background: var(--bg);
    padding: 60px 70px;
    display: none;
  }
  .slide.active { display: flex; flex-direction: column; }
  .slide-content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .slide-center { align-items: center; text-align: center; }
  .slide-title {
    font-family: var(--font-heading);
    font-size: 56px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .slide-subtitle {
    font-size: 24px;
    color: var(--text-muted);
    margin-top: 20px;
  }
  h2 {
    font-family: var(--font-heading);
    font-size: 42px;
    font-weight: 600;
    margin-bottom: 30px;
  }
  ul { list-style: none; padding: 0; }
  li {
    font-size: 20px;
    line-height: 1.6;
    margin-bottom: 16px;
    padding-left: 24px;
    position: relative;
  }
  li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--text);
  }
  .label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    margin-bottom: 12px;
  }
  .sources {
    font-size: 11px;
    color: #999;
    margin-top: auto;
    padding-top: 20px;
  }
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    margin-top: 30px;
  }
  .stat {
    padding: 24px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }
  .stat-number {
    font-family: var(--font-heading);
    font-size: 48px;
    font-weight: 600;
  }
  .stat-label {
    font-size: 16px;
    color: var(--text-muted);
    margin-top: 8px;
  }
`

/**
 * Generate HTML for a title slide
 */
function buildTitleSlide(headline: string, subtitle: string): string {
  return `
    <div class="slide-content slide-center">
      <h1 class="slide-title">${headline}</h1>
      <p class="slide-subtitle">${subtitle}</p>
    </div>
  `
}

/**
 * Generate HTML for a content slide with bullets
 */
function buildContentSlide(
  label: string,
  headline: string,
  bullets: string[],
  source?: string
): string {
  const bulletHTML = bullets.map(b => `<li>${b}</li>`).join('\n        ')
  const sourceHTML = source ? `<div class="sources">Source: ${source}</div>` : ''

  return `
    <div class="slide-content">
      <div class="label">${label}</div>
      <h2>${headline}</h2>
      <ul>
        ${bulletHTML}
      </ul>
      ${sourceHTML}
    </div>
  `
}

/**
 * Generate HTML for a stat grid slide
 */
function buildStatSlide(
  headline: string,
  stats: Array<{ value: string; label: string }>,
  source?: string
): string {
  const statsHTML = stats.map(s => `
      <div class="stat">
        <div class="stat-number">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>
  `).join('')
  const sourceHTML = source ? `<div class="sources">Source: ${source}</div>` : ''

  return `
    <div class="slide-content">
      <h2>${headline}</h2>
      <div class="stat-grid">
        ${statsHTML}
      </div>
      ${sourceHTML}
    </div>
  `
}

/**
 * Generate HTML for CTA slide
 */
function buildCTASlide(headline: string, action: string, contact: string): string {
  return `
    <div class="slide-content slide-center">
      <h1 class="slide-title">${headline}</h1>
      <p class="slide-subtitle">${action}</p>
      <p class="slide-subtitle" style="margin-top: 40px; font-size: 20px;">${contact}</p>
    </div>
  `
}

/**
 * Execute build step
 */
export function executeBuild(input: BuildInput): BuildOutput {
  const { context, research, outline } = input
  const sources: string[] = []
  const slides: SlidePipeline.SlideHTML[] = []

  for (const item of outline.headlines) {
    let html = ''

    switch (item.type) {
      case 'title':
        html = buildTitleSlide(
          item.headline,
          context.thesis
        )
        break

      case 'problem':
        html = buildContentSlide(
          'The Challenge',
          item.headline,
          research.supporting_facts.slice(0, 3).map(f => f.fact.slice(0, 80)),
          research.supporting_facts[0]?.source
        )
        if (research.supporting_facts[0]?.source) {
          sources.push(research.supporting_facts[0].source)
        }
        break

      case 'solution':
        html = buildContentSlide(
          'The Solution',
          item.headline,
          [
            'Clear approach to solving the problem',
            'Proven methodology with results',
            'Scalable and sustainable solution'
          ]
        )
        break

      case 'how':
        html = buildContentSlide(
          'How It Works',
          item.headline,
          [
            'Step 1: Understand the current state',
            'Step 2: Apply the solution systematically',
            'Step 3: Measure and optimize results'
          ]
        )
        break

      case 'market':
        html = buildStatSlide(
          item.headline,
          [
            { value: research.hook_stat?.value || 'Growing', label: 'Key Metric' },
            { value: '3x', label: 'Growth Potential' },
            { value: '85%', label: 'Success Rate' },
            { value: '2025', label: 'Target Year' }
          ],
          research.hook_stat?.source
        )
        if (research.hook_stat?.source) {
          sources.push(research.hook_stat.source)
        }
        break

      case 'impact':
        html = buildContentSlide(
          'Results',
          item.headline,
          research.case_studies.length > 0
            ? research.case_studies.map(c => c.description.slice(0, 80))
            : [
                'Measurable improvement in key metrics',
                'Positive feedback from stakeholders',
                'Sustainable long-term impact'
              ],
          research.case_studies[0]?.source
        )
        break

      case 'cta':
        html = buildCTASlide(
          item.headline,
          'Contact us to learn more about how we can help',
          'email@example.com | www.example.com'
        )
        break

      default:
        html = buildContentSlide(
          'Information',
          item.headline,
          ['Key point 1', 'Key point 2', 'Key point 3']
        )
    }

    slides.push({
      id: item.slide,
      type: item.type,
      html: `<div class="slide" id="slide-${item.slide}">${html}</div>`
    })
  }

  return { slides, sources: [...new Set(sources)] }
}

/**
 * Wrap slides in complete HTML document
 */
export function wrapInDocument(
  title: string,
  slides: SlidePipeline.SlideHTML[]
): string {
  const slidesHTML = slides.map(s => s.html).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Deck</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>${DESIGN_SYSTEM}</style>
</head>
<body>
  <div class="deck-container">
    ${slidesHTML}
  </div>

  <nav class="deck-nav">
    <button onclick="prev()">← Prev</button>
    <span id="counter">1 / ${slides.length}</span>
    <button onclick="next()">Next →</button>
  </nav>

  <style>
    .deck-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .deck-nav { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                display: flex; gap: 20px; align-items: center; background: white;
                padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .deck-nav button { padding: 8px 16px; border: 1px solid #ddd; background: white;
                       border-radius: 4px; cursor: pointer; font-size: 14px; }
    .deck-nav button:hover { background: #f5f5f5; }
    #counter { font-size: 14px; color: #666; min-width: 60px; text-align: center; }
  </style>

  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide');

    function show(n) {
      slides.forEach((s, i) => s.classList.toggle('active', i === n));
      document.getElementById('counter').textContent = (n + 1) + ' / ' + slides.length;
    }

    function next() { current = (current + 1) % slides.length; show(current); }
    function prev() { current = (current - 1 + slides.length) % slides.length; show(current); }

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    });

    show(0);
  </script>
</body>
</html>`
}
