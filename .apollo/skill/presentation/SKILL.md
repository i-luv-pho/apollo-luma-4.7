---
name: presentation
description: Create HTML/CSS presentations and slide decks. Use when user asks to create slides, presentations, pitch decks, or any slide-based content. Triggers on "presentation", "slides", "pitch deck", "slide deck", "create slides", "make a presentation".
---

# Presentation Creation Skill

## Workflow Rules

Before building any presentation:
1. **Clarify** — Ask the user what they're building, who the audience is, what the goal is
2. **Think** — Use your own logic to determine the best structure, don't just follow blindly
3. **Research** — If unfamiliar with the topic, gather context first
4. **Be intentional** — Every element should have a purpose. No decoration for decoration's sake.

After building:
1. Save the HTML file
2. Open in browser for user to preview
3. Offer to export as PNG (screenshot each slide)
4. Offer to export as PPTX if requested
5. Open the folder where files are saved

---

## Narrative Frameworks

Choose the right structure based on presentation type:

### Pitch Deck (Investors, Funding)
1. Hook — One compelling statement
2. Problem — The pain point you solve
3. Solution — What you built
4. How it works — Demo or visual
5. Traction — Numbers, users, growth
6. Team — Who's building this
7. Ask — What you need (funding, partnerships)

### Product Demo (Customers, Users)
1. Context — What world are we in
2. Pain — The problem they feel
3. Solution — Your product
4. Demo — Show it working
5. Benefits — What they gain
6. CTA — Next step to take

### Teaching/Educational
1. Overview — What we'll cover
2. Concept 1 — First key idea
3. Concept 2 — Second key idea
4. Concept 3 — Third key idea (if needed)
5. Summary — Key takeaways
6. Q&A or Resources — Where to learn more

---

## Notion Style Theme

When user requests "clean", "minimal", "Notion style", or "white background":

### Design Tokens (Notion Style)
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f7f7f7;
  --text-primary: #191919;
  --text-secondary: #6b6b6b;
  --accent: #000000;
  --border: #e5e5e5;
}
```

### Typography
- Headlines: `'Fraunces', Georgia, serif` (weight 600)
- Body: `'Inter', system-ui, sans-serif` (weight 400)
- Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### Design Rules
- White background, black text
- Use thin lines (1px borders) to create structure
- No emojis as icons
- No decorative SVGs
- Visualize with simple shapes, lines, and typography hierarchy
- Generous whitespace (padding: 80px+)

### Dimensions (Google Slides compatible)
```css
.slide {
  width: 1920px;
  height: 1080px;
}
```

---

## Before Creating
1. What is the presentation about?
2. Who is the audience?
3. What is the key message?
4. How many slides needed?

## Slide Structure

### Full HTML Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentation Title</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --accent: #3b82f6;
    }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .slide {
      width: 100vw;
      height: 100vh;
      padding: 64px;
      display: flex;
      flex-direction: column;
      scroll-snap-align: start;
    }

    .slides-container {
      height: 100vh;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
    }

    /* Title Slide */
    .slide-title {
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .slide-title h1 {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 700;
      background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .slide-title .subtitle {
      font-size: 1.5rem;
      color: var(--text-secondary);
      margin-top: 24px;
    }

    /* Content Slide */
    .slide-content h2 {
      font-size: 2rem;
      margin-bottom: 32px;
      color: var(--accent);
    }

    .slide-content ul {
      list-style: none;
      font-size: 1.25rem;
      line-height: 2;
    }

    .slide-content li::before {
      content: "→";
      color: var(--accent);
      margin-right: 16px;
    }

    /* Two Column */
    .slide-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: center;
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .slide.active * {
      animation: fadeIn 0.5s ease-out forwards;
    }
  </style>
</head>
<body>
  <div class="slides-container">
    <!-- Slides go here -->
  </div>
</body>
</html>
```

## Slide Type Templates

### 1. Title Slide
```html
<section class="slide slide-title">
  <h1>Presentation Title</h1>
  <p class="subtitle">Subtitle or tagline</p>
  <p class="meta">Author • Date</p>
</section>
```

### 2. Bullet Points
```html
<section class="slide slide-content">
  <h2>Section Title</h2>
  <ul>
    <li>First key point</li>
    <li>Second key point</li>
    <li>Third key point</li>
  </ul>
</section>
```

### 3. Two Column (Text + Visual)
```html
<section class="slide slide-split">
  <div>
    <h2>Heading</h2>
    <p>Description text explaining the concept.</p>
  </div>
  <div class="visual">
    <!-- Image, code, or diagram -->
  </div>
</section>
```

### 4. Quote Slide
```html
<section class="slide slide-quote">
  <blockquote>
    "The quote text goes here."
  </blockquote>
  <cite>— Attribution</cite>
</section>
```

### 5. Code Slide
```html
<section class="slide slide-code">
  <h2>Code Example</h2>
  <pre><code>
// Your code here
function example() {
  return "Hello World";
}
  </code></pre>
</section>
```

## Color Themes

### Dark (Default)
```css
--bg-primary: #0f172a;
--text-primary: #f8fafc;
--accent: #3b82f6;
```

### Light
```css
--bg-primary: #ffffff;
--text-primary: #1e293b;
--accent: #2563eb;
```

### Corporate
```css
--bg-primary: #1a1a2e;
--text-primary: #eaeaea;
--accent: #e94560;
```

## Best Practices
- One idea per slide
- Max 6 bullet points
- 30pt minimum font size
- High contrast colors
- Use visuals over text
- Consistent alignment
- Leave breathing room (whitespace)

## Workflow
1. Outline content (headings only)
2. Create title slide
3. Build content slides
4. Add visuals/code
5. Apply animations
6. Test at full screen
