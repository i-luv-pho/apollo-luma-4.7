# Slide Component Library

Reusable HTML/CSS components for presentations.

## Base Styles

```css
/* Import in all slides */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.slide {
  width: 100vw;
  height: 100vh;
  padding: 64px;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--color-bg-primary, #0f172a);
  color: var(--color-text-primary, #f8fafc);
}
```

---

## 1. Title Slide

### Preview
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│        PRESENTATION TITLE       │
│           Subtitle here         │
│                                 │
│         Author • Date           │
│                                 │
└─────────────────────────────────┘
```

### HTML
```html
<section class="slide slide-title">
  <h1 class="title">Presentation Title</h1>
  <p class="subtitle">Subtitle or tagline goes here</p>
  <p class="meta">Author Name • January 2026</p>
</section>
```

### CSS
```css
.slide-title {
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 24px;
}

.slide-title .title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.slide-title .subtitle {
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  color: var(--color-text-secondary, #94a3b8);
}

.slide-title .meta {
  font-size: 1rem;
  color: var(--color-text-muted, #64748b);
  margin-top: 48px;
}
```

---

## 2. Section Header

### Preview
```
┌─────────────────────────────────┐
│  01                             │
│                                 │
│  SECTION NAME                   │
│  Brief description              │
│                                 │
└─────────────────────────────────┘
```

### HTML
```html
<section class="slide slide-section">
  <span class="section-number">01</span>
  <h2 class="section-title">Section Name</h2>
  <p class="section-desc">Brief description of this section</p>
</section>
```

### CSS
```css
.slide-section {
  justify-content: center;
  gap: 16px;
}

.section-number {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-accent, #3b82f6);
  letter-spacing: 0.1em;
}

.section-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
}

.section-desc {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  max-width: 600px;
}
```

---

## 3. Bullet Points

### Preview
```
┌─────────────────────────────────┐
│  Slide Title                    │
│                                 │
│  • First key point here         │
│  • Second important item        │
│  • Third thing to remember      │
│  • Final takeaway               │
│                                 │
└─────────────────────────────────┘
```

### HTML
```html
<section class="slide slide-bullets">
  <h2 class="slide-heading">Slide Title</h2>
  <ul class="bullet-list">
    <li>First key point here</li>
    <li>Second important item</li>
    <li>Third thing to remember</li>
    <li>Final takeaway</li>
  </ul>
</section>
```

### CSS
```css
.slide-bullets {
  gap: 48px;
}

.slide-heading {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
}

.bullet-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.bullet-list li {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  line-height: 1.4;
}

.bullet-list li::before {
  content: '';
  width: 10px;
  height: 10px;
  background: var(--color-accent, #3b82f6);
  border-radius: 50%;
  margin-top: 0.4em;
  flex-shrink: 0;
}
```

---

## 4. Two Column (Text + Image)

### Preview
```
┌─────────────────────────────────┐
│  Slide Title                    │
│                                 │
│  Content text      ┌─────────┐  │
│  goes here on      │  IMAGE  │  │
│  the left side     │         │  │
│                    └─────────┘  │
└─────────────────────────────────┘
```

### HTML
```html
<section class="slide slide-two-col">
  <div class="col-content">
    <h2 class="slide-heading">Slide Title</h2>
    <p class="slide-text">
      Content text goes here. This layout is great for
      explaining concepts with visual support.
    </p>
    <ul class="bullet-list">
      <li>Supporting point one</li>
      <li>Supporting point two</li>
    </ul>
  </div>
  <div class="col-media">
    <img src="image.png" alt="Description" />
  </div>
</section>
```

### CSS
```css
.slide-two-col {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 64px;
  align-items: center;
}

.col-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.slide-text {
  font-size: 1.25rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.col-media img {
  width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Reverse variant */
.slide-two-col.reverse {
  grid-template-columns: 1fr 1.2fr;
}
.slide-two-col.reverse .col-media {
  order: -1;
}
```

---

## 5. Comparison (Two Column)

### Preview
```
┌─────────────────────────────────┐
│          Before vs After        │
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │  BEFORE   │ │   AFTER   │   │
│  │  • Item   │ │  • Item   │   │
│  │  • Item   │ │  • Item   │   │
│  └───────────┘ └───────────┘   │
└─────────────────────────────────┘
```

### HTML
```html
<section class="slide slide-comparison">
  <h2 class="slide-heading">Before vs After</h2>
  <div class="comparison-grid">
    <div class="comparison-col before">
      <h3>Before</h3>
      <ul>
        <li>Old way of doing things</li>
        <li>Manual process</li>
        <li>Time consuming</li>
      </ul>
    </div>
    <div class="comparison-col after">
      <h3>After</h3>
      <ul>
        <li>New improved approach</li>
        <li>Automated workflow</li>
        <li>10x faster</li>
      </ul>
    </div>
  </div>
</section>
```

### CSS
```css
.slide-comparison {
  gap: 48px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  flex: 1;
}

.comparison-col {
  background: var(--color-bg-secondary, #1e293b);
  border-radius: 16px;
  padding: 32px;
}

.comparison-col h3 {
  font-size: 1.25rem;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-text-muted);
}

.comparison-col.before h3 {
  color: var(--color-error, #ef4444);
}

.comparison-col.after h3 {
  color: var(--color-success, #22c55e);
}

.comparison-col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comparison-col li {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
}
```

---

## 6. Stats / Metrics

### Preview
```
┌─────────────────────────────────┐
│          Key Metrics            │
│                                 │
│   ┌─────┐  ┌─────┐  ┌─────┐    │
│   │ 50% │  │ 2.5x │  │ 99% │   │
│   │Saved│  │Faster│  │Uptime│   │
│   └─────┘  └─────┘  └─────┘    │
│                                 │
└─────────────────────────────────┘
```

### HTML
```html
<section class="slide slide-stats">
  <h2 class="slide-heading">Key Metrics</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-value">50%</span>
      <span class="stat-label">Time Saved</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">2.5x</span>
      <span class="stat-label">Faster Delivery</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">99.9%</span>
      <span class="stat-label">Uptime</span>
    </div>
  </div>
</section>
```

### CSS
```css
.slide-stats {
  gap: 64px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.stat-card {
  background: var(--color-bg-secondary);
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-value {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
}
```

---

## 7. Code Slide

### Preview
```
┌─────────────────────────────────┐
│  Implementation Example         │
│                                 │
│  ┌─────────────────────────┐   │
│  │ function hello() {      │   │
│  │   return "world";       │   │
│  │ }                       │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### HTML
```html
<section class="slide slide-code">
  <h2 class="slide-heading">Implementation Example</h2>
  <pre class="code-block"><code class="language-typescript">function processUser(user: User): Result {
  const validated = validateInput(user);

  if (!validated.success) {
    return { error: validated.message };
  }

  return { data: transform(user) };
}</code></pre>
  <p class="code-caption">user-service.ts:45</p>
</section>
```

### CSS
```css
.slide-code {
  gap: 32px;
}

.code-block {
  background: #0d1117;
  border-radius: 12px;
  padding: 32px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(0.875rem, 1.5vw, 1.125rem);
  line-height: 1.6;
  border: 1px solid #30363d;
}

.code-caption {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-family: monospace;
}
```

---

## 8. Quote Slide

### Preview
```
┌─────────────────────────────────┐
│                                 │
│    "Great quote goes here       │
│     that inspires action"       │
│                                 │
│           — Author Name         │
│             Title, Company      │
│                                 │
└─────────────────────────────────┘
```

### HTML
```html
<section class="slide slide-quote">
  <blockquote class="quote-text">
    "Great quote goes here that inspires action and
    reinforces the key message."
  </blockquote>
  <cite class="quote-author">
    <span class="author-name">Author Name</span>
    <span class="author-title">Title, Company</span>
  </cite>
</section>
```

### CSS
```css
.slide-quote {
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 96px;
}

.quote-text {
  font-size: clamp(1.5rem, 3.5vw, 2.5rem);
  font-weight: 500;
  line-height: 1.4;
  font-style: italic;
  max-width: 900px;
  color: var(--color-text-primary);
}

.quote-author {
  margin-top: 48px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-size: 1.125rem;
  font-weight: 600;
  font-style: normal;
}

.author-title {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-style: normal;
}
```

---

## 9. Thank You / CTA Slide

### Preview
```
┌─────────────────────────────────┐
│                                 │
│         Thank You               │
│                                 │
│     email@example.com           │
│     @username                   │
│                                 │
│      [ Get Started ]            │
│                                 │
└─────────────────────────────────┘
```

### HTML
```html
<section class="slide slide-cta">
  <h2 class="cta-title">Thank You</h2>
  <div class="cta-links">
    <a href="mailto:email@example.com">email@example.com</a>
    <a href="https://twitter.com/username">@username</a>
  </div>
  <a href="#" class="cta-button">Get Started</a>
</section>
```

### CSS
```css
.slide-cta {
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 32px;
}

.cta-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
}

.cta-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cta-links a {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 1.125rem;
}

.cta-links a:hover {
  color: var(--color-accent);
}

.cta-button {
  margin-top: 32px;
  padding: 16px 48px;
  background: var(--color-accent);
  color: white;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
}
```

---

## Component Usage Guide

| Slide Type | Use For |
|------------|---------|
| Title | Opening slide |
| Section Header | Topic transitions |
| Bullets | Key points, lists |
| Two Column | Concept + visual |
| Comparison | Before/after, A vs B |
| Stats | Metrics, KPIs |
| Code | Technical examples |
| Quote | Testimonials, emphasis |
| CTA | Closing, next steps |
