---
name: frontend-design
description: PROACTIVE SKILL - Auto-invoke for ANY visual/UI work. Use when designing screens, creating UI, building websites, landing pages, dashboards, React components, HTML files, mobile app screens, mockups, presentations, slides, or modifying any visual interface. Triggers on "design", "create screen", "build UI", "make a page", "style", "layout", "prototype", "HTML", "CSS", "interface", "presentation", "slides".
---

# Frontend Design Guidelines

## Before Building
1. What is the purpose of this UI?
2. Who is the user?
3. What actions should they take?
4. What's the visual hierarchy?

## Layout Principles
- Use consistent spacing (8px grid system)
- Group related elements
- Clear visual hierarchy (size, color, weight)
- Whitespace is your friend
- Mobile-first approach

## Component Structure
```
Container
├── Header (title, actions)
├── Content (main body)
└── Footer (secondary actions)
```

## Color Usage
- Primary: Main actions, brand
- Secondary: Supporting elements
- Neutral: Text, borders, backgrounds
- Semantic: Success (green), Error (red), Warning (yellow)

## Typography
- Max 2-3 font sizes per screen
- Clear hierarchy: heading > subheading > body
- Line height: 1.5 for body text
- Contrast ratio: 4.5:1 minimum

## Interactive Elements
- Buttons: Clear labels, obvious clickability
- Forms: Labels above inputs, clear validation
- Feedback: Loading states, success/error messages
- Hover/focus states for all interactive elements

## Accessibility
- Semantic HTML (button, nav, main, etc.)
- Alt text for images
- Keyboard navigation
- Color not sole indicator

## Tech Stack Defaults
- React + Tailwind CSS (preferred)
- Use Lucide icons (NEVER emoji as icons)
- shadcn/ui components when available

---

# Presentation Design (HTML/CSS Slides)

## Slide Base Structure
```css
.slide {
  width: 100vw;
  height: 100vh;
  padding: 64px;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg-primary, #0f172a);
  color: var(--text-primary, #f8fafc);
}
```

## Slide Types

### 1. Title Slide
```html
<section class="slide slide-title">
  <h1 class="title">Presentation Title</h1>
  <p class="subtitle">Subtitle here</p>
  <p class="meta">Author • Date</p>
</section>
```

### 2. Content Slide
```html
<section class="slide slide-content">
  <h2 class="heading">Section Title</h2>
  <ul class="bullets">
    <li>Point one</li>
    <li>Point two</li>
    <li>Point three</li>
  </ul>
</section>
```

### 3. Two-Column Slide
```html
<section class="slide slide-split">
  <div class="col-left">
    <h2>Left Content</h2>
    <p>Description</p>
  </div>
  <div class="col-right">
    <!-- Image or code -->
  </div>
</section>
```

## Design Tokens for Slides
```css
:root {
  /* Dark Theme */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent: #3b82f6;

  /* Typography */
  --font-title: clamp(2.5rem, 6vw, 4rem);
  --font-heading: clamp(1.75rem, 4vw, 2.5rem);
  --font-body: clamp(1rem, 2vw, 1.25rem);

  /* Spacing */
  --space-sm: 16px;
  --space-md: 32px;
  --space-lg: 64px;
}
```

## Animation Patterns
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fadeIn 0.5s ease-out forwards;
}

/* Stagger children */
.stagger > *:nth-child(1) { animation-delay: 0.1s; }
.stagger > *:nth-child(2) { animation-delay: 0.2s; }
.stagger > *:nth-child(3) { animation-delay: 0.3s; }
```

## Presentation Best Practices
- One idea per slide
- Max 6 bullet points
- Use visuals over text
- High contrast for readability
- Test at actual presentation size
