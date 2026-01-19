---
name: frontend-design
description: PROACTIVE SKILL - Auto-invoke for ANY visual/UI work. Use when designing screens, creating UI, building websites, landing pages, dashboards, React components, mobile app screens, mockups, or modifying any visual interface. Triggers on "design", "create screen", "build UI", "make a page", "style", "layout", "prototype", "interface". NOTE - For presentations/slides/decks, use the dedicated presentation skill instead.
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

