---
name: presentation
description: Create professional HTML presentations. Triggers on "presentation", "slides", "pitch deck", "deck about", "make slides".
---

# Presentation Skill

## CRITICAL: DO NOT ASK QUESTIONS

When user asks for a presentation, DO NOT ask clarifying questions. Just:
1. Research the topic using websearch
2. Generate 7 slides immediately
3. Save and open in browser

## Step 1: Research First

Before generating ANY content:
- Use websearch tool to find real information about the topic
- Gather statistics, facts, market data from credible sources
- Note sources for citations
- Mark unverified claims as [NEEDS CITATION]

## Step 2: Slide Structure (7 slides default)

1. **Title Slide** - Topic + subtitle
2. **Problem/Context** - Why this topic matters
3. **Solution/Overview** - Main thesis or approach
4. **Details** - Key supporting points (max 5 bullets)
5. **Data/Evidence** - Statistics, proof points
6. **Impact/Benefits** - Results, outcomes
7. **Conclusion** - Summary + call-to-action

## Step 3: Design Rules (STRICT - NO EXCEPTIONS)

- Background: `#ffffff` (white) ONLY
- Text: `#000000` (black) ONLY
- NO colors, NO gradients, NO animations
- NO emojis, NO icons, NO SVGs, NO decorations
- Typography: Fraunces (Google Font) for headlines, Inter for body
- Slide dimensions: 1280x720 (16:9)
- Generous padding (80px minimum)
- Max 6 bullet points per slide

## Step 4: HTML Template

Generate this EXACT structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Topic] Presentation</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #f5f5f5;
      color: #000;
    }
    .slide {
      width: 1280px;
      height: 720px;
      background: #fff;
      margin: 40px auto;
      padding: 80px;
      display: none;
      flex-direction: column;
      justify-content: center;
    }
    .slide.active { display: flex; }
    h1, h2 {
      font-family: 'Fraunces', serif;
      color: #000;
      font-weight: 600;
    }
    h1 { font-size: 64px; margin-bottom: 24px; }
    h2 { font-size: 48px; margin-bottom: 40px; }
    p { font-size: 28px; line-height: 1.6; margin-bottom: 20px; }
    ul { list-style: none; }
    li {
      font-size: 28px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    li::before {
      content: "—";
      margin-right: 16px;
      color: #000;
    }
    .subtitle {
      font-size: 32px;
      color: #666;
    }
    .nav {
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .nav button {
      padding: 12px 24px;
      background: #000;
      color: #fff;
      border: none;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
    }
    .nav button:hover { background: #333; }
    #counter { font-size: 18px; color: #666; }
  </style>
</head>
<body>
  <div class="slide active">
    <h1>[Title]</h1>
    <p class="subtitle">[Subtitle]</p>
  </div>
  <div class="slide">
    <h2>[Slide 2 Title]</h2>
    <ul>
      <li>[Point 1]</li>
      <li>[Point 2]</li>
      <li>[Point 3]</li>
    </ul>
  </div>
  <!-- Continue for all 7 slides -->

  <div class="nav">
    <button onclick="prev()">← Prev</button>
    <span id="counter">1 / 7</span>
    <button onclick="next()">Next →</button>
  </div>

  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide');
    const total = slides.length;

    function show(index) {
      slides.forEach(s => s.classList.remove('active'));
      slides[index].classList.add('active');
      document.getElementById('counter').textContent = (index + 1) + ' / ' + total;
    }

    function next() {
      if (current < total - 1) {
        current++;
        show(current);
      }
    }

    function prev() {
      if (current > 0) {
        current--;
        show(current);
      }
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    });
  </script>
</body>
</html>
```

## Step 5: After Generation

1. Save the HTML file with descriptive name (e.g., `ww2-doctors-presentation.html`)
2. Open in browser automatically
3. Tell user: "Presentation ready. Use arrow keys to navigate."

## DO NOT:
- Ask questions about style, theme, or preferences
- Use any colors other than black and white
- Add gradients, shadows, or animations
- Use emojis or decorative icons
- Deviate from the 7-slide structure
- Skip the research step
