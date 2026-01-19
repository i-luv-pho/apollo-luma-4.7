import type { Argv } from "yargs"
import path from "path"
import fs from "fs"
import { cmd } from "./cmd"
import { UI } from "../ui"
import { bootstrap } from "../bootstrap"
import { createApolloClient } from "@apollo-ai/sdk/v2"
import { Server } from "../../server/server"
import open from "open"

const DECK_DIR = path.join(process.env.HOME || "~", "Apollo", "decks")

const DECK_SYSTEM_PROMPT = `You are Deck, an AI that creates professional pitch decks for Assumption University students.

## Your Purpose
Create academic-quality pitch decks with real research, credible sources, and professional design.

## CRITICAL: Research First
Before generating ANY slide content:
1. Search the web for relevant information about the topic
2. Find real statistics, market data, and credible sources
3. Verify dates - use recent data (2023-2025)
4. For academic presentations, prioritize peer-reviewed sources when possible
5. If you cannot verify a fact, mark it as [CITATION NEEDED] so the student can verify

## Design Rules (STRICT)
- White background (#ffffff) only
- Black text (#000000) only
- NO colors, NO gradients, NO emojis, NO icons, NO SVGs
- Visual interest through typography, spacing, and simple black lines/borders
- Headlines: Fraunces font (serif, editorial)
- Body text: Inter font (sans-serif)
- Slide size: 1280x720 (16:9)
- Safe margins: 80px on all sides

## Slide Structure (Default 7 slides)
1. Title - Company/project name, tagline, presenter name, date
2. Problem - Clear problem statement with data to support
3. Solution - How you solve it, key differentiators
4. How It Works - Visual workflow or explanation
5. Market - TAM/SAM/SOM or target audience with data
6. Validation - Traction, research findings, or planned validation
7. Ask - What you need, next steps, contact info

## Output Format
Generate valid HTML for each slide. Each slide should be a <div class="slide" data-slide="N"> with:
- Absolutely positioned elements
- Proper class names for editing (slide-title, slide-text, etc.)
- All text should be editable (will get contenteditable="true")

## Academic Context
- This is for Assumption University Thailand students
- Presentations may be for courses, capstone projects, or startup competitions
- Research quality matters more than flash
- Leave [PLACEHOLDER] for course code, professor name, student ID if relevant
- Cite sources where possible using footnotes or a sources slide

## Typography Scale
- Main title: 72-96px, Fraunces, bold
- Section headers: 40-52px, Fraunces, bold
- Subheaders: 28-36px, Inter, semibold
- Body text: 18-24px, Inter, regular
- Captions/sources: 14-16px, Inter, regular, gray (#666)

When asked to generate a deck, output a JSON object with this structure:
{
  "title": "Deck Title",
  "slides": [
    {
      "id": 1,
      "type": "title",
      "html": "<div class='slide-content'>...</div>"
    }
  ],
  "sources": ["Source 1", "Source 2"]
}
`

function getNextDeckId(): string {
  if (!fs.existsSync(DECK_DIR)) {
    fs.mkdirSync(DECK_DIR, { recursive: true })
  }

  const existing = fs.readdirSync(DECK_DIR)
    .filter(f => /^\d{3}-/.test(f))
    .map(f => parseInt(f.slice(0, 3)))
    .sort((a, b) => b - a)

  const next = (existing[0] || 0) + 1
  return String(next).padStart(3, "0")
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

function generateDeckHTML(title: string, slides: string[] = [], autoDownload: boolean = false): string {
  const slideHTML = slides.length > 0
    ? slides.map((html, i) => `
      <div class="slide ${i === 0 ? 'active' : ''}" data-slide="${i + 1}">
        ${html}
      </div>`).join("\n")
    : `
      <div class="slide active" data-slide="1">
        <div class="slide-content slide-center">
          <h1 class="slide-title">${title}</h1>
          <p class="slide-subtitle">Generating your deck...</p>
          <div class="loader"></div>
        </div>
      </div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Deck</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgenjs.bundle.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"><\/script>
  <style>
    :root {
      /* Google Slides inspired light theme */
      --bg: #f8f9fa;
      --bg-pattern: #f1f3f4;
      --surface: #ffffff;
      --border: #e0e0e0;
      --border-light: #eeeeee;
      --text: #202124;
      --text-muted: #5f6368;
      --text-dim: #9aa0a6;
      --accent: #1a73e8;
      --accent-hover: #1557b0;
      --slide-bg: #ffffff;
      --slide-text: #000000;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      height: 100%;
      overflow: hidden;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
    }

    /* ═══════════════════════════════════════════════════════════
       TOOLBAR - Top bar with logo and export buttons
       ═══════════════════════════════════════════════════════════ */
    .toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px 0 20px;
      z-index: 100;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .toolbar.hidden {
      opacity: 0;
      transform: translateY(-100%);
      pointer-events: none;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.03em;
    }

    .divider {
      width: 1px;
      height: 24px;
      background: var(--border);
      margin: 0 4px;
    }

    .deck-title {
      font-size: 18px;
      font-weight: 400;
      color: var(--text);
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 500;
      padding: 9px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover {
      background: var(--bg);
      border-color: var(--text-dim);
    }

    .btn-primary {
      background: var(--accent);
      color: #ffffff;
    }

    .btn-primary:hover {
      background: var(--accent-hover);
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    .btn-icon {
      width: 18px;
      height: 18px;
      opacity: 0.9;
    }

    .badge {
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: #e8f0fe;
      color: var(--accent);
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 4px;
    }

    .badge-beta {
      background: #fef7e0;
      color: #b06000;
    }

    /* ═══════════════════════════════════════════════════════════
       MAIN VIEWER - Centered slide display
       ═══════════════════════════════════════════════════════════ */
    .viewer {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 90px 60px 80px;
      position: relative;
      /* Subtle checkered pattern like Google Slides */
      background:
        linear-gradient(var(--bg) 0%, var(--bg) 100%),
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 10px,
          rgba(0,0,0,0.01) 10px,
          rgba(0,0,0,0.01) 20px
        );
    }

    .slide-container {
      position: relative;
      width: 100%;
      max-width: 960px;
      aspect-ratio: 16 / 9;
    }

    .slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--slide-bg);
      border-radius: 4px;
      box-shadow:
        0 1px 2px rgba(60,64,67,0.3),
        0 2px 6px 2px rgba(60,64,67,0.15);
      overflow: hidden;
      opacity: 0;
      transform: scale(0.98);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    }

    .slide.active {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    /* ═══════════════════════════════════════════════════════════
       SLIDE CONTENT - Typography and layout
       ═══════════════════════════════════════════════════════════ */
    .slide-content {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 60px 70px;
      display: flex;
      flex-direction: column;
      color: var(--slide-text);
    }

    .slide-center {
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .slide-title, h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 56px;
      font-weight: 600;
      letter-spacing: -0.03em;
      line-height: 1.1;
      color: var(--slide-text);
      margin-bottom: 16px;
    }

    h2 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 36px;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.2;
      color: var(--slide-text);
      margin-bottom: 24px;
    }

    .slide-subtitle, .slide-text, p {
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: 400;
      line-height: 1.6;
      color: #444;
    }

    .slide-subtitle {
      font-size: 22px;
      color: #666;
    }

    .label {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #999;
      margin-bottom: 16px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 16px 0;
    }

    ul li {
      position: relative;
      padding-left: 28px;
      margin-bottom: 14px;
      font-size: 18px;
      line-height: 1.5;
      color: var(--slide-text);
    }

    ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      width: 8px;
      height: 8px;
      background: var(--slide-text);
      border-radius: 50%;
    }

    .sources {
      position: absolute;
      bottom: 24px;
      left: 70px;
      right: 70px;
      font-size: 11px;
      color: #999;
    }

    /* Editable content */
    [contenteditable="true"] {
      outline: none;
      border-radius: 4px;
      transition: box-shadow 0.15s ease;
    }

    [contenteditable="true"]:hover {
      box-shadow: 0 0 0 2px rgba(0,0,0,0.08);
    }

    [contenteditable="true"]:focus {
      box-shadow: 0 0 0 2px rgba(0,0,0,0.2);
    }

    /* Loader animation */
    .loader {
      width: 40px;
      height: 40px;
      border: 3px solid #eee;
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-top: 32px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ═══════════════════════════════════════════════════════════
       NAVIGATION - Bottom bar with slide controls
       ═══════════════════════════════════════════════════════════ */
    .nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 56px;
      background: var(--surface);
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 100;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .nav.hidden {
      opacity: 0;
      transform: translateY(100%);
      pointer-events: none;
    }

    .nav-btn {
      width: 40px;
      height: 40px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 50%;
      color: var(--text-muted);
      font-size: 18px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-btn:hover {
      background: var(--bg);
      color: var(--text);
      border-color: var(--text-dim);
    }

    .nav-btn:active {
      transform: scale(0.95);
    }

    .nav-indicator {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted);
      min-width: 70px;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .nav-indicator strong {
      color: var(--text);
      font-weight: 600;
    }

    .nav-keys {
      position: absolute;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .key-hint {
      font-size: 12px;
      color: var(--text-dim);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 22px;
      padding: 0 6px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
    }

    /* ═══════════════════════════════════════════════════════════
       TOAST NOTIFICATIONS
       ═══════════════════════════════════════════════════════════ */
    .toast {
      position: fixed;
      bottom: 76px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #323232;
      color: #ffffff;
      padding: 14px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 200;
      opacity: 0;
      transition: all 0.25s ease;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* ═══════════════════════════════════════════════════════════
       STATUS INDICATOR
       ═══════════════════════════════════════════════════════════ */
    .status {
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 13px;
      color: var(--text-muted);
      z-index: 99;
      display: none;
      align-items: center;
      gap: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .status.active {
      display: flex;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--accent);
      border-radius: 50%;
      animation: pulse 1.2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }

    /* ═══════════════════════════════════════════════════════════
       FULLSCREEN MODE
       ═══════════════════════════════════════════════════════════ */
    body.fullscreen {
      background: #000;
    }

    body.fullscreen .toolbar,
    body.fullscreen .nav {
      opacity: 0;
      pointer-events: none;
    }

    body.fullscreen .viewer {
      padding: 0;
    }

    body.fullscreen .slide-container {
      max-width: 100vw;
      max-height: 100vh;
      border-radius: 0;
    }

    body.fullscreen .slide {
      border-radius: 0;
      box-shadow: none;
    }

    /* ═══════════════════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      .toolbar {
        height: 56px;
        padding: 0 12px;
      }

      .deck-title {
        display: none;
      }

      .divider {
        display: none;
      }

      .viewer {
        padding: 70px 16px 70px;
      }

      .slide-content {
        padding: 40px 50px;
      }

      .slide-title, h1 {
        font-size: 40px;
      }

      h2 {
        font-size: 28px;
      }

      .nav-keys {
        display: none;
      }

      .btn span {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Toolbar -->
  <header class="toolbar" id="toolbar">
    <div class="toolbar-left">
      <span class="logo">Deck</span>
      <div class="divider"></div>
      <span class="deck-title" id="deck-title">${title}</span>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-secondary" onclick="downloadPNG()" title="Download as PNG images">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        <span>PNG</span>
      </button>
      <button class="btn btn-secondary" onclick="downloadPPTX()" title="Download as PowerPoint">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        <span>PPTX</span>
        <span class="badge badge-beta">Beta</span>
      </button>
    </div>
  </header>

  <!-- Status -->
  <div class="status" id="status">
    <div class="status-dot"></div>
    <span id="status-text">Generating...</span>
  </div>

  <!-- Main Viewer -->
  <main class="viewer">
    <div class="slide-container" id="slide-container">
      ${slideHTML}
    </div>
  </main>

  <!-- Navigation -->
  <nav class="nav" id="nav">
    <button class="nav-btn" onclick="prevSlide()" title="Previous slide">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>
    <span class="nav-indicator">
      <strong id="current-slide">1</strong> / <span id="total-slides">${slides.length || 1}</span>
    </span>
    <button class="nav-btn" onclick="nextSlide()" title="Next slide">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
    <div class="nav-keys">
      <span class="key-hint"><span class="key">←</span><span class="key">→</span> Navigate</span>
      <span class="key-hint"><span class="key">F</span> Fullscreen</span>
    </div>
  </nav>

  <!-- Toast -->
  <div class="toast" id="toast"></div>

  <script>
    // ═══════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════
    let currentSlide = 1;
    let totalSlides = ${slides.length || 1};
    let ws = null;
    let idleTimer = null;
    let isFullscreen = false;
    const autoDownload = ${autoDownload};

    // ═══════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
      initSlides();
      initKeyboard();
      initWebSocket();
      initAutoHide();
      initEditing();
      updateNav();
    });

    function initSlides() {
      const slides = document.querySelectorAll('.slide');
      totalSlides = slides.length;

      // Ensure first slide is active
      if (slides.length > 0) {
        slides.forEach((s, i) => s.classList.toggle('active', i === 0));
      }
    }

    // ═══════════════════════════════════════════════════════════
    // WEBSOCKET - Live updates from server
    // ═══════════════════════════════════════════════════════════
    function initWebSocket() {
      if (window.location.protocol === 'file:') return;

      try {
        ws = new WebSocket(\`ws://\${window.location.host}/ws\`);

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleMessage(data);
        };

        ws.onopen = () => {
          showStatus('Connected');
          setTimeout(hideStatus, 2000);
        };

        ws.onclose = () => console.log('WebSocket closed');
      } catch (e) {
        console.log('WebSocket not available');
      }
    }

    function handleMessage(data) {
      if (data.type === 'slide_update') {
        showStatus('Updating slide ' + data.slideId + '...');
        updateSlide(data.slideId, data.html);
      }

      if (data.type === 'deck_complete') {
        showStatus('Deck complete!');
        showToast('Deck generated successfully!');
        setTimeout(hideStatus, 3000);

        // Auto-download both formats
        if (autoDownload) {
          setTimeout(async () => {
            showToast('Downloading files...');
            await downloadPNG();
            await downloadPPTX();
            showToast('Downloads complete!');
          }, 1500);
        }
      }

      if (data.type === 'generating') {
        showStatus(data.message || 'Generating...');
      }

      if (data.type === 'full_refresh') {
        window.location.reload();
      }
    }

    function updateSlide(slideId, html) {
      const container = document.getElementById('slide-container');
      let slide = document.querySelector(\`[data-slide="\${slideId}"]\`);

      if (slide) {
        slide.innerHTML = html;
      } else {
        const newSlide = document.createElement('div');
        newSlide.className = 'slide';
        newSlide.dataset.slide = slideId;
        newSlide.innerHTML = html;
        container.appendChild(newSlide);
      }

      totalSlides = document.querySelectorAll('.slide').length;
      updateNav();
      initEditing();

      // Show the new slide briefly
      if (parseInt(slideId) === currentSlide) {
        showSlide(currentSlide);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════
    function showSlide(num) {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i + 1 === num);
      });
      currentSlide = num;
      updateNav();
    }

    function nextSlide() {
      if (currentSlide < totalSlides) {
        showSlide(currentSlide + 1);
      }
    }

    function prevSlide() {
      if (currentSlide > 1) {
        showSlide(currentSlide - 1);
      }
    }

    function goToSlide(num) {
      if (num >= 1 && num <= totalSlides) {
        showSlide(num);
      }
    }

    function updateNav() {
      document.getElementById('current-slide').textContent = currentSlide;
      document.getElementById('total-slides').textContent = totalSlides;
    }

    // ═══════════════════════════════════════════════════════════
    // KEYBOARD CONTROLS
    // ═══════════════════════════════════════════════════════════
    function initKeyboard() {
      document.addEventListener('keydown', (e) => {
        // Don't capture when editing
        if (document.activeElement?.getAttribute('contenteditable') === 'true') return;

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
          case ' ':
          case 'Enter':
            e.preventDefault();
            nextSlide();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            prevSlide();
            break;
          case 'f':
          case 'F':
            e.preventDefault();
            toggleFullscreen();
            break;
          case 'Escape':
            if (isFullscreen) {
              e.preventDefault();
              toggleFullscreen();
            }
            break;
          case '1': case '2': case '3': case '4': case '5':
          case '6': case '7': case '8': case '9':
            e.preventDefault();
            goToSlide(parseInt(e.key));
            break;
        }

        resetIdleTimer();
      });
    }

    // ═══════════════════════════════════════════════════════════
    // FULLSCREEN MODE
    // ═══════════════════════════════════════════════════════════
    function toggleFullscreen() {
      isFullscreen = !isFullscreen;
      document.body.classList.toggle('fullscreen', isFullscreen);

      if (isFullscreen) {
        document.documentElement.requestFullscreen?.();
        showToast('Press ESC or F to exit fullscreen');
      } else {
        document.exitFullscreen?.();
      }
    }

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && isFullscreen) {
        isFullscreen = false;
        document.body.classList.remove('fullscreen');
      }
    });

    // ═══════════════════════════════════════════════════════════
    // AUTO-HIDE UI
    // ═══════════════════════════════════════════════════════════
    function initAutoHide() {
      document.addEventListener('mousemove', resetIdleTimer);
      document.addEventListener('click', resetIdleTimer);
      resetIdleTimer();
    }

    function resetIdleTimer() {
      // Show UI
      document.getElementById('toolbar').classList.remove('hidden');
      document.getElementById('nav').classList.remove('hidden');

      // Clear existing timer
      if (idleTimer) clearTimeout(idleTimer);

      // Set new timer (hide after 4 seconds of inactivity)
      idleTimer = setTimeout(() => {
        if (!isFullscreen) {
          document.getElementById('toolbar').classList.add('hidden');
          document.getElementById('nav').classList.add('hidden');
        }
      }, 4000);
    }

    // ═══════════════════════════════════════════════════════════
    // EDITING
    // ═══════════════════════════════════════════════════════════
    function initEditing() {
      document.querySelectorAll('.slide-title, .slide-subtitle, .slide-text, h1, h2, h3, p, li').forEach(el => {
        if (el.closest('.slide')) {
          el.setAttribute('contenteditable', 'true');
        }
      });
    }

    function saveChanges() {
      const slides = [];
      document.querySelectorAll('.slide').forEach(slide => {
        slides.push({
          id: parseInt(slide.dataset.slide),
          html: slide.innerHTML
        });
      });

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'save', slides }));
      }

      showToast('Changes saved');
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT - PNG
    // ═══════════════════════════════════════════════════════════
    async function downloadPNG() {
      try {
        showToast('Generating PNG images...');

        if (typeof html2canvas === 'undefined') {
          showToast('Error: html2canvas not loaded');
          return;
        }
        if (typeof JSZip === 'undefined') {
          showToast('Error: JSZip not loaded');
          return;
        }

        const slides = document.querySelectorAll('.slide');
        if (slides.length === 0) {
          showToast('No slides to export');
          return;
        }

        const zip = new JSZip();
        const deckTitle = document.getElementById('deck-title')?.textContent || 'deck';
        const safeTitle = deckTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);

        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          showToast(\`Capturing slide \${i + 1} of \${slides.length}...\`);

          // Temporarily make slide visible and full size for capture
          slide.style.position = 'fixed';
          slide.style.top = '0';
          slide.style.left = '0';
          slide.style.width = '1280px';
          slide.style.height = '720px';
          slide.style.transform = 'none';
          slide.style.opacity = '1';
          slide.style.zIndex = '-1';

          const canvas = await html2canvas(slide, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 1280,
            height: 720
          });

          // Restore
          slide.style.position = '';
          slide.style.top = '';
          slide.style.left = '';
          slide.style.width = '';
          slide.style.height = '';
          slide.style.transform = '';
          slide.style.opacity = '';
          slide.style.zIndex = '';

          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          zip.file(\`slide-\${String(i + 1).padStart(2, '0')}.png\`, blob);
        }

        showToast('Creating ZIP file...');
        const content = await zip.generateAsync({ type: 'blob' });
        downloadBlob(content, \`\${safeTitle}-slides.zip\`);

        showToast('PNG images downloaded!');
      } catch (err) {
        console.error('PNG export error:', err);
        showToast('Export failed: ' + err.message);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT - PPTX
    // ═══════════════════════════════════════════════════════════
    async function downloadPPTX() {
      try {
        showToast('Generating PowerPoint...');

        if (typeof PptxGenJS === 'undefined') {
          showToast('Error: PptxGenJS not loaded');
          return;
        }
        if (typeof html2canvas === 'undefined') {
          showToast('Error: html2canvas not loaded');
          return;
        }

        const slides = document.querySelectorAll('.slide');
        if (slides.length === 0) {
          showToast('No slides to export');
          return;
        }

        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        pptx.title = document.getElementById('deck-title')?.textContent || 'Deck';
        pptx.author = 'Deck by Apollo';

        const deckTitle = document.getElementById('deck-title')?.textContent || 'deck';
        const safeTitle = deckTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);

        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          showToast(\`Converting slide \${i + 1} of \${slides.length}...\`);

          // Temporarily make slide visible for capture
          slide.style.position = 'fixed';
          slide.style.top = '0';
          slide.style.left = '0';
          slide.style.width = '1280px';
          slide.style.height = '720px';
          slide.style.transform = 'none';
          slide.style.opacity = '1';
          slide.style.zIndex = '-1';

          const canvas = await html2canvas(slide, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 1280,
            height: 720
          });

          // Restore
          slide.style.position = '';
          slide.style.top = '';
          slide.style.left = '';
          slide.style.width = '';
          slide.style.height = '';
          slide.style.transform = '';
          slide.style.opacity = '';
          slide.style.zIndex = '';

          const pptxSlide = pptx.addSlide();
          pptxSlide.addImage({
            data: canvas.toDataURL('image/png'),
            x: 0,
            y: 0,
            w: '100%',
            h: '100%'
          });
        }

        showToast('Saving PowerPoint file...');
        await pptx.writeFile({ fileName: \`\${safeTitle}.pptx\` });

        showToast('PowerPoint downloaded!');
      } catch (err) {
        console.error('PPTX export error:', err);
        showToast('Export failed: ' + err.message);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════
    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function showStatus(message) {
      const status = document.getElementById('status');
      document.getElementById('status-text').textContent = message;
      status.classList.add('active');
    }

    function hideStatus() {
      document.getElementById('status').classList.remove('active');
    }

    // Click on slide to advance
    document.getElementById('slide-container').addEventListener('click', (e) => {
      if (!e.target.closest('[contenteditable="true"]')) {
        nextSlide();
      }
    });
  <\/script>
</body>
</html>`
}

export const DeckCommand = cmd({
  command: "deck [topic..]",
  describe: "Generate an AI-powered pitch deck",
  builder: (yargs: Argv) => {
    return yargs
      .positional("topic", {
        describe: "Topic for your pitch deck",
        type: "string",
        array: true,
        default: [],
      })
      .option("slides", {
        type: "number",
        default: 7,
        describe: "Number of slides",
      })
      .option("port", {
        type: "number",
        default: 3456,
        describe: "Port to serve on",
      })
      .option("open", {
        type: "boolean",
        default: true,
        describe: "Auto-open browser",
      })
      .option("output", {
        type: "string",
        alias: "o",
        describe: "Output directory (default: ~/Apollo/decks)",
      })
  },
  handler: async (args) => {
    const topic = [...args.topic, ...(args["--"] || [])].join(" ").trim()

    if (!topic) {
      UI.error("Please provide a topic for your deck")
      UI.println("Usage: apollo deck \"AI-powered food delivery for students\"")
      process.exit(1)
    }

    UI.println()
    UI.println(UI.Style.TEXT_HIGHLIGHT_BOLD + "Deck" + UI.Style.TEXT_NORMAL + " — AI Pitch Deck Builder")
    UI.println()

    // Create deck directory
    const deckId = getNextDeckId()
    const slug = slugify(topic)
    const outputDir = args.output || path.join(DECK_DIR, `${deckId}-${slug}`)

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const htmlPath = path.join(outputDir, "deck.html")

    // Generate initial HTML
    const initialHTML = generateDeckHTML(topic)
    fs.writeFileSync(htmlPath, initialHTML)

    UI.println(UI.Style.TEXT_DIM + "Topic:  " + UI.Style.TEXT_NORMAL + topic)
    UI.println(UI.Style.TEXT_DIM + "Output: " + UI.Style.TEXT_NORMAL + outputDir)
    UI.println()

    // Start local server
    const port = args.port
    const clients: Set<any> = new Set()

    const server = Bun.serve({
      port,
      fetch(req, server) {
        const url = new URL(req.url)

        // WebSocket upgrade
        if (url.pathname === "/ws") {
          const upgraded = server.upgrade(req)
          if (!upgraded) {
            return new Response("WebSocket upgrade failed", { status: 400 })
          }
          return undefined
        }

        // Serve deck HTML
        if (url.pathname === "/" || url.pathname === "/index.html") {
          const html = fs.readFileSync(htmlPath, "utf-8")
          return new Response(html, {
            headers: { "Content-Type": "text/html" }
          })
        }

        return new Response("Not found", { status: 404 })
      },
      websocket: {
        open(ws) {
          clients.add(ws)
        },
        close(ws) {
          clients.delete(ws)
        },
        message(ws, message) {
          try {
            const data = JSON.parse(String(message))
            if (data.type === "save") {
              // Rebuild HTML from slides
              const slidesHTML = data.slides
                .sort((a: any, b: any) => a.id - b.id)
                .map((s: any) => s.html)
              const newHTML = generateDeckHTML(topic, slidesHTML)
              fs.writeFileSync(htmlPath, newHTML)
            }
          } catch (e) {
            console.error("WebSocket message error:", e)
          }
        },
      },
    })

    const broadcast = (data: any) => {
      const msg = JSON.stringify(data)
      clients.forEach((client) => {
        try {
          client.send(msg)
        } catch (e) {}
      })
    }

    UI.println(UI.Style.TEXT_SUCCESS_BOLD + "Server running at " + UI.Style.TEXT_NORMAL + `http://localhost:${port}`)
    UI.println()

    // Open browser
    if (args.open) {
      await open(`http://localhost:${port}`)
    }

    // Now generate the deck with AI
    UI.println(UI.Style.TEXT_INFO_BOLD + "Generating deck..." + UI.Style.TEXT_NORMAL)
    UI.println()

    await bootstrap(process.cwd(), async () => {
      const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init)
        return Server.App().fetch(request)
      }) as typeof globalThis.fetch

      const sdk = createApolloClient({ baseUrl: "http://apollo.internal", fetch: fetchFn })

      // Create session
      const sessionResult = await sdk.session.create({ title: `Deck: ${topic}` })
      const sessionID = sessionResult.data?.id

      if (!sessionID) {
        UI.error("Failed to create session")
        process.exit(1)
      }

      // Subscribe to events
      const events = await sdk.event.subscribe()

      let generatedSlides: string[] = []
      let slideCount = 0

      const eventProcessor = (async () => {
        for await (const event of events.stream) {
          if (event.type === "message.part.updated") {
            const part = event.properties.part
            if (part.sessionID !== sessionID) continue

            if (part.type === "tool" && part.state.status === "completed") {
              if (part.tool === "websearch") {
                UI.println(UI.Style.TEXT_DIM + "  Researching..." + UI.Style.TEXT_NORMAL)
                broadcast({ type: "generating", message: "Researching..." })
              }
            }

            if (part.type === "text" && part.time?.end) {
              // Try to parse JSON from the response
              try {
                // Extract JSON from markdown code blocks if present
                let jsonText = part.text
                const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
                if (jsonMatch) {
                  jsonText = jsonMatch[1]
                }

                const data = JSON.parse(jsonText.trim())

                if (data.slides && Array.isArray(data.slides)) {
                  UI.println(UI.Style.TEXT_SUCCESS_BOLD + "Generated " + data.slides.length + " slides" + UI.Style.TEXT_NORMAL)

                  generatedSlides = data.slides.map((s: any) => s.html)

                  // Update each slide
                  data.slides.forEach((slide: any, i: number) => {
                    slideCount++
                    broadcast({
                      type: "slide_update",
                      slideId: slide.id || i + 1,
                      html: `<div class="slide-content">${slide.html}</div>`
                    })
                    UI.println(UI.Style.TEXT_DIM + `  Slide ${slide.id || i + 1}: ${slide.type || "content"}`)
                  })

                  // Save the complete deck with auto-download enabled
                  const finalHTML = generateDeckHTML(topic, generatedSlides.map(h => `<div class="slide-content">${h}</div>`), true)
                  fs.writeFileSync(htmlPath, finalHTML)

                  broadcast({ type: "deck_complete" })
                  broadcast({ type: "full_refresh" })

                  if (data.sources && data.sources.length > 0) {
                    UI.println()
                    UI.println(UI.Style.TEXT_DIM + "Sources:" + UI.Style.TEXT_NORMAL)
                    data.sources.forEach((s: string) => {
                      UI.println(UI.Style.TEXT_DIM + "  - " + s)
                    })
                  }
                }
              } catch (e) {
                // Not JSON, might be progress update
                if (part.text.includes("Slide")) {
                  UI.println(UI.Style.TEXT_DIM + "  " + part.text.slice(0, 80))
                }
              }
            }
          }

          if (event.type === "session.error") {
            const props = event.properties
            if (props.sessionID !== sessionID) continue
            UI.error(String(props.error))
          }

          if (event.type === "session.idle" && event.properties.sessionID === sessionID) {
            break
          }
        }
      })()

      // Send the prompt
      const prompt = `Create a ${args.slides}-slide pitch deck about: "${topic}"

This is for a student at Assumption University Thailand. The presentation should be:
- Academic quality with real research
- Professional and credible
- Black and white design only

Use web search to find real statistics, market data, and relevant information.

Return ONLY a JSON object with this exact structure:
{
  "title": "Deck Title",
  "slides": [
    {
      "id": 1,
      "type": "title",
      "html": "<h1 class='slide-title'>Title Here</h1><p class='slide-subtitle'>Tagline</p>"
    },
    {
      "id": 2,
      "type": "problem",
      "html": "<div class='label'>THE PROBLEM</div><h2>Problem statement</h2><p class='slide-text'>Details...</p>"
    }
  ],
  "sources": ["Source 1 - URL or Citation", "Source 2"]
}

Make sure each slide HTML uses:
- .slide-title, .slide-subtitle for titles
- .label for section labels (uppercase, small)
- h2 for section headers
- .slide-text for body text
- ul/li for bullet points
- .sources for citations at the bottom

Research thoroughly before generating. Include real data.`

      await sdk.session.prompt({
        sessionID,
        system: DECK_SYSTEM_PROMPT,
        parts: [{ type: "text", text: prompt }],
      })

      await eventProcessor
    })

    UI.println()
    UI.println(UI.Style.TEXT_SUCCESS_BOLD + "Deck ready!" + UI.Style.TEXT_NORMAL)
    UI.println()
    UI.println(UI.Style.TEXT_DIM + "View:   " + UI.Style.TEXT_NORMAL + `http://localhost:${port}`)
    UI.println(UI.Style.TEXT_DIM + "Files:  " + UI.Style.TEXT_NORMAL + outputDir)
    UI.println()
    UI.println(UI.Style.TEXT_DIM + "Press Ctrl+C to stop the server" + UI.Style.TEXT_NORMAL)

    // Open the folder
    await open(outputDir)

    // Keep server running
    await new Promise(() => {})
  },
})
