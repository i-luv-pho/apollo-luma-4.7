# Advanced Animations & Creative Effects

Complete collection of modern CSS animations, effects, and creative design patterns.

---

## Table of Contents
1. [Glassmorphism](#1-glassmorphism)
2. [Neumorphism](#2-neumorphism)
3. [Card Animations](#3-card-animations)
4. [3D Transforms](#4-3d-transforms)
5. [Parallax Effects](#5-parallax-effects)
6. [Bento Grid Layouts](#6-bento-grid-layouts)
7. [Aurora & Gradient Effects](#7-aurora--gradient-effects)
8. [Kinetic Typography](#8-kinetic-typography)
9. [Scroll Animations](#9-scroll-animations)
10. [Micro-interactions](#10-micro-interactions)
11. [Loading Animations](#11-loading-animations)
12. [Particle Effects](#12-particle-effects)

---

## 1. Glassmorphism

Frosted glass effect used by Apple and Microsoft.

### Basic Glass Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Layered Glass (Multi-depth)
```css
.glass-layer-1 {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(4px);
}

.glass-layer-2 {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
}

.glass-layer-3 {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
}
```

### Animated Glass Hover
```css
.glass-hover {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.glass-hover:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-4px);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}
```

### Glass with Gradient Border
```css
.glass-gradient-border {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2px;
}

.glass-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 2px;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.4),
    rgba(255, 255, 255, 0.1));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
```

---

## 2. Neumorphism

Soft, extruded UI elements.

### Raised Element
```css
.neu-raised {
  background: #e0e5ec;
  border-radius: 16px;
  box-shadow:
    8px 8px 16px #a3b1c6,
    -8px -8px 16px #ffffff;
}
```

### Pressed/Inset Element
```css
.neu-pressed {
  background: #e0e5ec;
  border-radius: 16px;
  box-shadow:
    inset 8px 8px 16px #a3b1c6,
    inset -8px -8px 16px #ffffff;
}
```

### Neumorphic Button (Toggle)
```css
.neu-button {
  background: #e0e5ec;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  box-shadow:
    6px 6px 12px #a3b1c6,
    -6px -6px 12px #ffffff;
  transition: all 0.2s ease;
  cursor: pointer;
}

.neu-button:hover {
  box-shadow:
    4px 4px 8px #a3b1c6,
    -4px -4px 8px #ffffff;
}

.neu-button:active,
.neu-button.pressed {
  box-shadow:
    inset 4px 4px 8px #a3b1c6,
    inset -4px -4px 8px #ffffff;
}
```

### Dark Mode Neumorphism
```css
.neu-dark {
  background: #1a1a2e;
  border-radius: 16px;
  box-shadow:
    8px 8px 16px #0f0f1a,
    -8px -8px 16px #252542;
}
```

---

## 3. Card Animations

### Hover Lift
```css
.card-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}
```

### Card Flip (3D)
```html
<div class="flip-card">
  <div class="flip-card-inner">
    <div class="flip-card-front">Front Content</div>
    <div class="flip-card-back">Back Content</div>
  </div>
</div>
```

```css
.flip-card {
  width: 300px;
  height: 400px;
  perspective: 1000px;
}

.flip-card-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-style: preserve-3d;
}

.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
}

.flip-card-back {
  transform: rotateY(180deg);
}
```

### Card Tilt (Mouse Follow)
```css
.card-tilt {
  transition: transform 0.1s ease;
  transform-style: preserve-3d;
}

/* Apply via JS: transform: rotateX(Ydeg) rotateY(Xdeg) */
```

```javascript
// Tilt effect JavaScript
const card = document.querySelector('.card-tilt');

card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateX = (y - centerY) / 10;
  const rotateY = (centerX - x) / 10;

  card.style.transform = `
    perspective(1000px)
    rotateX(${rotateX}deg)
    rotateY(${rotateY}deg)
    scale3d(1.05, 1.05, 1.05)
  `;
});

card.addEventListener('mouseleave', () => {
  card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
});
```

### Card Stack / Spread
```css
.card-stack {
  position: relative;
}

.card-stack .card {
  position: absolute;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.card-stack .card:nth-child(1) { z-index: 3; }
.card-stack .card:nth-child(2) {
  z-index: 2;
  transform: translateY(10px) scale(0.95);
  opacity: 0.8;
}
.card-stack .card:nth-child(3) {
  z-index: 1;
  transform: translateY(20px) scale(0.9);
  opacity: 0.6;
}

/* On hover, spread cards */
.card-stack:hover .card:nth-child(1) { transform: translateX(-120px) rotate(-5deg); }
.card-stack:hover .card:nth-child(2) { transform: translateY(0) scale(1); opacity: 1; }
.card-stack:hover .card:nth-child(3) { transform: translateX(120px) rotate(5deg); opacity: 1; }
```

### Magnetic Card (Cursor Attraction)
```javascript
const card = document.querySelector('.magnetic-card');
const strength = 50;

card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;

  card.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
});

card.addEventListener('mouseleave', () => {
  card.style.transform = 'translate(0, 0)';
});
```

---

## 4. 3D Transforms

### Rotating Cube
```html
<div class="cube-container">
  <div class="cube">
    <div class="face front">1</div>
    <div class="face back">2</div>
    <div class="face right">3</div>
    <div class="face left">4</div>
    <div class="face top">5</div>
    <div class="face bottom">6</div>
  </div>
</div>
```

```css
.cube-container {
  width: 200px;
  height: 200px;
  perspective: 800px;
}

.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: rotateCube 10s infinite linear;
}

.face {
  position: absolute;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background: rgba(59, 130, 246, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.front  { transform: translateZ(100px); }
.back   { transform: rotateY(180deg) translateZ(100px); }
.right  { transform: rotateY(90deg) translateZ(100px); }
.left   { transform: rotateY(-90deg) translateZ(100px); }
.top    { transform: rotateX(90deg) translateZ(100px); }
.bottom { transform: rotateX(-90deg) translateZ(100px); }

@keyframes rotateCube {
  0%   { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}
```

### 3D Card Carousel
```css
.carousel {
  position: relative;
  width: 300px;
  height: 400px;
  perspective: 1000px;
}

.carousel-track {
  width: 100%;
  height: 100%;
  position: absolute;
  transform-style: preserve-3d;
  animation: rotateCarousel 20s infinite linear;
}

.carousel-item {
  position: absolute;
  width: 280px;
  height: 380px;
  left: 10px;
  top: 10px;
  border-radius: 16px;
}

/* Position 8 items in a circle */
.carousel-item:nth-child(1) { transform: rotateY(0deg) translateZ(400px); }
.carousel-item:nth-child(2) { transform: rotateY(45deg) translateZ(400px); }
.carousel-item:nth-child(3) { transform: rotateY(90deg) translateZ(400px); }
.carousel-item:nth-child(4) { transform: rotateY(135deg) translateZ(400px); }
.carousel-item:nth-child(5) { transform: rotateY(180deg) translateZ(400px); }
.carousel-item:nth-child(6) { transform: rotateY(225deg) translateZ(400px); }
.carousel-item:nth-child(7) { transform: rotateY(270deg) translateZ(400px); }
.carousel-item:nth-child(8) { transform: rotateY(315deg) translateZ(400px); }

@keyframes rotateCarousel {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(360deg); }
}
```

---

## 5. Parallax Effects

### CSS-Only Parallax
```css
.parallax-container {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  perspective: 1px;
}

.parallax-layer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.parallax-back {
  transform: translateZ(-2px) scale(3);
}

.parallax-mid {
  transform: translateZ(-1px) scale(2);
}

.parallax-front {
  transform: translateZ(0);
}
```

### Scroll-Based Parallax (JS)
```javascript
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;

  document.querySelector('.parallax-slow').style.transform =
    `translateY(${scrolled * 0.3}px)`;

  document.querySelector('.parallax-fast').style.transform =
    `translateY(${scrolled * 0.7}px)`;
});
```

### Mouse Parallax
```javascript
document.addEventListener('mousemove', (e) => {
  const x = (window.innerWidth / 2 - e.clientX) / 50;
  const y = (window.innerHeight / 2 - e.clientY) / 50;

  document.querySelector('.layer-1').style.transform =
    `translate(${x * 1}px, ${y * 1}px)`;
  document.querySelector('.layer-2').style.transform =
    `translate(${x * 2}px, ${y * 2}px)`;
  document.querySelector('.layer-3').style.transform =
    `translate(${x * 3}px, ${y * 3}px)`;
});
```

---

## 6. Bento Grid Layouts

Modern asymmetric grid inspired by Japanese lunch boxes.

### Basic Bento Grid
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 16px;
  padding: 16px;
}

.bento-item {
  background: var(--color-bg-secondary);
  border-radius: 24px;
  padding: 24px;
  transition: all 0.3s ease;
}

/* Large feature item */
.bento-item.large {
  grid-column: span 2;
  grid-row: span 2;
}

/* Wide item */
.bento-item.wide {
  grid-column: span 2;
}

/* Tall item */
.bento-item.tall {
  grid-row: span 2;
}
```

### Interactive Bento (Hover Expand)
```css
.bento-interactive {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  transition: all 0.4s ease;
}

.bento-interactive .item {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.bento-interactive .item:hover {
  grid-column: span 2;
  grid-row: span 2;
  z-index: 10;
}

.bento-interactive:has(.item:hover) .item:not(:hover) {
  opacity: 0.5;
  transform: scale(0.95);
}
```

### Bento with Video Reveal
```css
.bento-video {
  position: relative;
  overflow: hidden;
}

.bento-video video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.bento-video:hover video {
  opacity: 1;
}

.bento-video .content {
  position: relative;
  z-index: 1;
  transition: opacity 0.5s ease;
}

.bento-video:hover .content {
  opacity: 0;
}
```

---

## 7. Aurora & Gradient Effects

### Animated Aurora Background
```css
.aurora-bg {
  background: linear-gradient(-45deg,
    #0f172a, #1e3a5f, #0f172a, #1e1b4b, #0f172a);
  background-size: 400% 400%;
  animation: auroraShift 15s ease infinite;
}

@keyframes auroraShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### Mesh Gradient (Multiple Blobs)
```css
.mesh-gradient {
  position: relative;
  background: #0f172a;
  overflow: hidden;
}

.mesh-gradient::before,
.mesh-gradient::after {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.6;
  animation: meshFloat 20s ease-in-out infinite;
}

.mesh-gradient::before {
  background: radial-gradient(circle, #3b82f6, transparent 70%);
  top: -200px;
  left: -200px;
}

.mesh-gradient::after {
  background: radial-gradient(circle, #8b5cf6, transparent 70%);
  bottom: -200px;
  right: -200px;
  animation-delay: -10s;
}

@keyframes meshFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(100px, 50px) scale(1.1); }
  50% { transform: translate(50px, 100px) scale(0.9); }
  75% { transform: translate(-50px, 50px) scale(1.05); }
}
```

### Gradient Border Animation
```css
.gradient-border {
  position: relative;
  background: #0f172a;
  border-radius: 16px;
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  background: linear-gradient(45deg,
    #3b82f6, #8b5cf6, #ec4899, #3b82f6);
  background-size: 300% 300%;
  animation: borderRotate 4s linear infinite;
  z-index: -1;
}

@keyframes borderRotate {
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}
```

### Spotlight / Glow Follow Cursor
```css
.spotlight {
  position: relative;
  overflow: hidden;
}

.spotlight::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle,
    rgba(59, 130, 246, 0.3),
    transparent 70%);
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.spotlight:hover::before {
  opacity: 1;
}
```

```javascript
// Spotlight follows cursor
const spotlight = document.querySelector('.spotlight');
spotlight.addEventListener('mousemove', (e) => {
  const rect = spotlight.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  spotlight.style.setProperty('--x', x + 'px');
  spotlight.style.setProperty('--y', y + 'px');
});
```

### Noise Texture Overlay
```css
.noise-overlay {
  position: relative;
}

.noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.05;
  pointer-events: none;
}
```

---

## 8. Kinetic Typography

### Text Reveal (Letter by Letter)
```html
<h1 class="text-reveal">
  <span>H</span><span>e</span><span>l</span><span>l</span><span>o</span>
</h1>
```

```css
.text-reveal span {
  display: inline-block;
  opacity: 0;
  transform: translateY(50px) rotateX(-90deg);
  animation: letterReveal 0.6s forwards;
}

.text-reveal span:nth-child(1) { animation-delay: 0.1s; }
.text-reveal span:nth-child(2) { animation-delay: 0.2s; }
.text-reveal span:nth-child(3) { animation-delay: 0.3s; }
.text-reveal span:nth-child(4) { animation-delay: 0.4s; }
.text-reveal span:nth-child(5) { animation-delay: 0.5s; }

@keyframes letterReveal {
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}
```

### Glitch Text Effect
```css
.glitch {
  position: relative;
  font-size: 4rem;
  font-weight: 700;
}

.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch::before {
  color: #ff00ff;
  animation: glitch-1 2s infinite linear;
  clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
}

.glitch::after {
  color: #00ffff;
  animation: glitch-2 2s infinite linear;
  clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
}

@keyframes glitch-1 {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
}

@keyframes glitch-2 {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(3px, -3px); }
  40% { transform: translate(3px, 3px); }
  60% { transform: translate(-3px, -3px); }
  80% { transform: translate(-3px, 3px); }
}
```

### Typewriter Effect
```css
.typewriter {
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid var(--color-accent);
  animation:
    typing 3s steps(30) forwards,
    blink 0.75s step-end infinite;
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink {
  50% { border-color: transparent; }
}
```

### Text Gradient Animation
```css
.text-gradient-animated {
  background: linear-gradient(90deg,
    #3b82f6, #8b5cf6, #ec4899, #3b82f6);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientText 3s linear infinite;
}

@keyframes gradientText {
  to { background-position: 200% center; }
}
```

### Wavy Text
```css
.wavy-text span {
  display: inline-block;
  animation: wave 1s ease-in-out infinite;
}

.wavy-text span:nth-child(1) { animation-delay: 0.0s; }
.wavy-text span:nth-child(2) { animation-delay: 0.1s; }
.wavy-text span:nth-child(3) { animation-delay: 0.2s; }
/* ... continue for each letter */

@keyframes wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}
```

---

## 9. Scroll Animations

### Intersection Observer (Reveal on Scroll)
```css
.scroll-reveal {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s cubic-bezier(0.17, 0.55, 0.55, 1);
}

.scroll-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.scroll-reveal').forEach(el => {
  observer.observe(el);
});
```

### Scroll Progress Bar
```css
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background: var(--gradient-primary);
  transform-origin: left;
  z-index: 1000;
}
```

```javascript
window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  document.querySelector('.progress-bar').style.transform = `scaleX(${scrolled / 100})`;
});
```

### Horizontal Scroll Section
```css
.horizontal-scroll {
  height: 100vh;
  display: flex;
  overflow-x: hidden;
}

.horizontal-scroll .panel {
  min-width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

```javascript
// With GSAP ScrollTrigger
gsap.to('.horizontal-scroll', {
  x: () => -(document.querySelector('.horizontal-scroll').scrollWidth - window.innerWidth),
  ease: 'none',
  scrollTrigger: {
    trigger: '.horizontal-scroll',
    pin: true,
    scrub: 1,
    end: () => '+=' + document.querySelector('.horizontal-scroll').scrollWidth
  }
});
```

---

## 10. Micro-interactions

### Button Ripple Effect
```css
.btn-ripple {
  position: relative;
  overflow: hidden;
}

.btn-ripple::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  transform: scale(0);
  opacity: 0;
}

.btn-ripple:active::after {
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
}
```

### Toggle Switch
```css
.toggle {
  width: 60px;
  height: 32px;
  background: #ccc;
  border-radius: 16px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle::after {
  content: '';
  position: absolute;
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.toggle.active {
  background: var(--color-accent);
}

.toggle.active::after {
  transform: translateX(28px);
}
```

### Checkbox Animation
```css
.checkbox-custom {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-text-secondary);
  border-radius: 6px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-custom.checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.checkbox-custom::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 2px 2px 0;
  top: 3px;
  left: 7px;
  transform: rotate(45deg) scale(0);
  transition: transform 0.2s;
}

.checkbox-custom.checked::after {
  transform: rotate(45deg) scale(1);
}
```

### Floating Action Button
```css
.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fab:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5);
}

.fab:active {
  transform: scale(0.95);
}
```

---

## 11. Loading Animations

### Spinner
```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Pulse Dots
```css
.pulse-dots {
  display: flex;
  gap: 8px;
}

.pulse-dots span {
  width: 12px;
  height: 12px;
  background: var(--color-accent);
  border-radius: 50%;
  animation: pulse 1.4s ease-in-out infinite;
}

.pulse-dots span:nth-child(1) { animation-delay: 0s; }
.pulse-dots span:nth-child(2) { animation-delay: 0.2s; }
.pulse-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
```

### Skeleton Loading
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-primary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Progress Bar (Animated)
```css
.progress {
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 4px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: progressShine 2s infinite;
}

@keyframes progressShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

---

## 12. Particle Effects

### CSS-Only Floating Particles
```css
.particles {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  border-radius: 50%;
  opacity: 0.3;
  animation: float 20s infinite;
}

.particle:nth-child(1) { left: 10%; animation-delay: 0s; animation-duration: 25s; }
.particle:nth-child(2) { left: 20%; animation-delay: 2s; animation-duration: 20s; }
.particle:nth-child(3) { left: 30%; animation-delay: 4s; animation-duration: 28s; }
.particle:nth-child(4) { left: 40%; animation-delay: 6s; animation-duration: 22s; }
.particle:nth-child(5) { left: 50%; animation-delay: 8s; animation-duration: 26s; }
.particle:nth-child(6) { left: 60%; animation-delay: 10s; animation-duration: 24s; }
.particle:nth-child(7) { left: 70%; animation-delay: 12s; animation-duration: 30s; }
.particle:nth-child(8) { left: 80%; animation-delay: 14s; animation-duration: 21s; }
.particle:nth-child(9) { left: 90%; animation-delay: 16s; animation-duration: 27s; }

@keyframes float {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-100vh) scale(1);
    opacity: 0;
  }
}
```

### Confetti Burst
```javascript
function createConfetti() {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b'];

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: 50%;
      top: 50%;
      pointer-events: none;
      animation: confetti-fall ${2 + Math.random() * 2}s forwards;
      --x: ${(Math.random() - 0.5) * 400}px;
      --y: ${-200 - Math.random() * 200}px;
      --r: ${Math.random() * 720}deg;
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
}
```

```css
@keyframes confetti-fall {
  0% {
    transform: translate(0, 0) rotate(0);
    opacity: 1;
  }
  100% {
    transform: translate(var(--x), calc(var(--y) + 100vh)) rotate(var(--r));
    opacity: 0;
  }
}
```

---

## Quick Reference: Animation Timing Functions

```css
/* Ease Presets */
--ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--ease-out-back: cubic-bezier(0.175, 0.885, 0.32, 1.275);
--ease-out-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);

--ease-in-out-quad: cubic-bezier(0.455, 0.03, 0.515, 0.955);
--ease-in-out-cubic: cubic-bezier(0.645, 0.045, 0.355, 1);

/* Spring-like */
--spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
--bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## Performance Tips

1. **Use `transform` and `opacity`** - GPU accelerated
2. **Avoid animating** `width`, `height`, `top`, `left` - causes reflow
3. **Use `will-change`** sparingly for complex animations
4. **Prefer `@keyframes`** over JS for simple animations
5. **Use `requestAnimationFrame`** for JS animations
6. **Test on low-end devices** - reduce motion for accessibility

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Sources
- [MDN CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using)
- [Josh Comeau Keyframe Guide](https://www.joshwcomeau.com/animation/keyframe-animations/)
- [Glass UI Generator](https://ui.glass/generator/)
- [Neumorphism.io](https://neumorphism.io/)
- [2026 Design Trends](https://www.theedigital.com/blog/web-design-trends)
- [Bento Grid Trends](https://writerdock.in/blog/bento-grids-and-beyond-7-ui-trends-dominating-web-design-2026)
