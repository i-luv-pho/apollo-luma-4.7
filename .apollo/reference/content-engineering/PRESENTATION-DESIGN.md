# HTML/CSS Presentation Design

## Framework Comparison

| Framework | Input | Navigation | Best For |
|-----------|-------|------------|----------|
| **Reveal.js** | HTML | 2D (nested) | Flexible, full-featured |
| **Impress.js** | HTML | 3D spatial | Prezi-like effects |
| **Slidev** | Markdown | Linear | Developer workflows |
| **Remark** | Markdown | Linear | Simple, fast |
| **Deck.js** | HTML | Linear | Lightweight |

## Recommended: Reveal.js

### Why Reveal.js
- Browser-native (works anywhere)
- Responsive by default
- Rich plugin ecosystem
- Export to PDF
- Speaker notes support
- 2-axis navigation (horizontal sections, vertical details)

### Basic Structure
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="reveal.css">
  <link rel="stylesheet" href="theme/black.css">
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section>Slide 1</section>
      <section>
        <section>Slide 2.1 (vertical)</section>
        <section>Slide 2.2 (vertical)</section>
      </section>
      <section>Slide 3</section>
    </div>
  </div>
  <script src="reveal.js"></script>
  <script>Reveal.initialize();</script>
</body>
</html>
```

## Design Tokens for Slides

### Typography Scale
```css
:root {
  /* Font Families */
  --font-heading: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font Sizes (modular scale 1.25) */
  --text-xs: 0.64rem;    /* 10px */
  --text-sm: 0.8rem;     /* 13px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.25rem;    /* 20px */
  --text-xl: 1.563rem;   /* 25px */
  --text-2xl: 1.953rem;  /* 31px */
  --text-3xl: 2.441rem;  /* 39px */
  --text-4xl: 3.052rem;  /* 49px */

  /* Line Heights */
  --leading-tight: 1.1;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Font Weights */
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-bold: 700;
}
```

### Spacing Scale
```css
:root {
  /* Base unit: 4px */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px */
}
```

### Color Tokens
```css
:root {
  /* Semantic Colors */
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-accent: #3b82f6;

  --color-text-primary: #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;

  --color-accent: #3b82f6;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  --gradient-dark: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
}
```

## Responsive Patterns

### Viewport-Based Sizing
```css
/* Slide container */
.slide {
  width: 100vw;
  height: 100vh;
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
}

/* Scale text based on viewport */
.slide h1 {
  font-size: clamp(var(--text-2xl), 5vw, var(--text-4xl));
}

.slide p {
  font-size: clamp(var(--text-base), 2vw, var(--text-xl));
}
```

### Aspect Ratio Container
```css
/* 16:9 slide container */
.slide-container {
  aspect-ratio: 16 / 9;
  max-width: 100%;
  max-height: 100vh;
  margin: auto;
  overflow: hidden;
}
```

## Layout Patterns

### Title Slide
```css
.slide-title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: var(--space-6);
}
```

### Two-Column
```css
.slide-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  align-items: center;
}
```

### Content + Image
```css
.slide-content-image {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: var(--space-8);
}

.slide-content-image.reverse {
  grid-template-columns: 0.8fr 1.2fr;
}
```

### Bullet List
```css
.slide-bullets {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.slide-bullets li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.slide-bullets li::before {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--color-accent);
  border-radius: 50%;
  margin-top: 0.5em;
  flex-shrink: 0;
}
```

## Animation Patterns

### Entrance Animations
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp 0.6s ease-out forwards;
}

/* Stagger children */
.stagger > * {
  opacity: 0;
}
.stagger.active > *:nth-child(1) { animation-delay: 0.1s; }
.stagger.active > *:nth-child(2) { animation-delay: 0.2s; }
.stagger.active > *:nth-child(3) { animation-delay: 0.3s; }
```

## Sources
- [Reveal.js](https://revealjs.com/)
- [Slidev](https://best-of-web.builder.io/library/slidevjs/slidev)
- [USWDS Design Tokens](https://designsystem.digital.gov/design-tokens/)
- [Adobe Spectrum Tokens](https://spectrum.adobe.com/page/design-tokens/)
- [Wise Design Spacing](https://wise.design/foundations/spacing)
