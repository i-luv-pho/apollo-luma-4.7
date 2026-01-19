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

function generateDeckHTML(title: string, slides: string[] = []): string {
  const slideHTML = slides.length > 0
    ? slides.map((html, i) => `
    <div class="slide" data-slide="${i + 1}">
      ${html}
      <div class="slide-number">${i + 1}</div>
    </div>`).join("\n")
    : `
    <div class="slide" data-slide="1">
      <div class="slide-content slide-title-layout">
        <h1 class="slide-title" contenteditable="true">${title}</h1>
        <p class="slide-subtitle" contenteditable="true">Generating your deck...</p>
      </div>
      <div class="slide-number">1</div>
    </div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Deck</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgenjs.bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
      color: #000;
      min-height: 100vh;
    }

    /* Toolbar - OUTSIDE the deck */
    .toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 56px;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 1000;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .toolbar-logo {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
    }

    .toolbar-title {
      font-size: 14px;
      color: #999;
      border-left: 1px solid #333;
      padding-left: 16px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-ghost {
      background: transparent;
      color: #fff;
      border: 1px solid #333;
    }

    .btn-ghost:hover {
      background: #222;
      border-color: #444;
    }

    .btn-primary {
      background: #fff;
      color: #000;
    }

    .btn-primary:hover {
      background: #e5e5e5;
    }

    /* Main area - deck preview */
    .main {
      padding-top: 80px;
      padding-bottom: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Slide container - smaller preview */
    .slide-wrapper {
      margin: 24px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .slide-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .slide {
      width: 960px;
      height: 540px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      transform-origin: center;
    }

    .slide-number {
      position: absolute;
      bottom: 24px;
      right: 32px;
      font-size: 11px;
      color: #999;
      font-weight: 500;
    }

    /* Slide content area */
    .slide-content {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 60px;
      display: flex;
      flex-direction: column;
    }

    /* Typography - Fraunces for headlines */
    .slide-title,
    .headline,
    h1, h2 {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.1;
      color: #000;
    }

    .slide-title {
      font-size: 54px;
    }

    h2 {
      font-size: 32px;
    }

    /* Body text - Inter */
    .slide-subtitle,
    .slide-text,
    p, li {
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      line-height: 1.5;
      color: #000;
    }

    .slide-subtitle {
      font-size: 20px;
      color: #666;
      margin-top: 16px;
    }

    .slide-text {
      font-size: 16px;
    }

    .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #999;
      font-weight: 600;
      margin-bottom: 16px;
    }

    /* Layout helpers */
    .slide-title-layout {
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .slide-content-layout {
      justify-content: flex-start;
    }

    .slide-split {
      display: flex;
      gap: 48px;
    }

    .slide-split > div {
      flex: 1;
    }

    /* Editable styles */
    [contenteditable="true"] {
      outline: none;
      border-radius: 2px;
      transition: box-shadow 0.15s ease;
    }

    [contenteditable="true"]:hover {
      box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
    }

    [contenteditable="true"]:focus {
      box-shadow: 0 0 0 2px #000;
    }

    /* Bullet list */
    ul {
      list-style: none;
      padding: 0;
    }

    ul li {
      position: relative;
      padding-left: 24px;
      margin-bottom: 12px;
      font-size: 16px;
    }

    ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 6px;
      height: 6px;
      background: #000;
      border-radius: 50%;
    }

    /* Source footnotes */
    .sources {
      position: absolute;
      bottom: 24px;
      left: 32px;
      font-size: 10px;
      color: #999;
    }

    /* Navigation - OUTSIDE the deck */
    .nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      z-index: 1000;
    }

    .nav-btn {
      background: transparent;
      border: 1px solid #333;
      color: #fff;
      width: 40px;
      height: 40px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.15s ease;
    }

    .nav-btn:hover {
      background: #222;
      border-color: #444;
    }

    .nav-indicator {
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      min-width: 80px;
      text-align: center;
    }

    /* Toast notification */
    .toast {
      position: fixed;
      bottom: 88px;
      left: 50%;
      transform: translateX(-50%);
      background: #000;
      color: #fff;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 2000;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .toast.show {
      opacity: 1;
    }

    /* Status indicator */
    .status {
      position: fixed;
      top: 72px;
      right: 24px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 13px;
      color: #666;
      z-index: 999;
      display: none;
    }

    .status.active {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #000;
      border-radius: 50%;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .slide {
        width: 720px;
        height: 405px;
      }

      .slide-title { font-size: 40px; }
      h2 { font-size: 24px; }
      .slide-subtitle { font-size: 16px; }
      .slide-text { font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-left">
      <span class="toolbar-logo">Deck</span>
      <span class="toolbar-title" id="deck-title">${title}</span>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-ghost" onclick="saveChanges()">Save</button>
      <button class="btn btn-ghost" onclick="downloadImages()">Export PNG</button>
      <button class="btn btn-primary" onclick="downloadPPTX()">Export PPTX</button>
    </div>
  </div>

  <div class="status" id="status">
    <div class="status-dot"></div>
    <span id="status-text">Generating...</span>
  </div>

  <div class="main" id="slides-container">
    ${slideHTML}
  </div>

  <div class="nav">
    <button class="nav-btn" onclick="prevSlide()">&#8592;</button>
    <span class="nav-indicator">
      <span id="current-slide">1</span> / <span id="total-slides">${slides.length || 1}</span>
    </span>
    <button class="nav-btn" onclick="nextSlide()">&#8594;</button>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let currentSlide = 1;
    let totalSlides = ${slides.length || 1};
    let ws = null;

    document.addEventListener('DOMContentLoaded', () => {
      initEditing();
      initKeyboard();
      initWebSocket();
      updateNav();
    });

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
          setTimeout(() => hideStatus(), 2000);
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
        };
      } catch (e) {
        console.log('WebSocket not available');
      }
    }

    function handleMessage(data) {
      if (data.type === 'slide_update') {
        showStatus('Updating slide ' + data.slideId + '...');
        updateSlide(data.slideId, data.html);
        hideStatus();
      }

      if (data.type === 'deck_complete') {
        showStatus('Deck complete!');
        setTimeout(() => hideStatus(), 3000);
        showToast('Deck generated successfully');
      }

      if (data.type === 'generating') {
        showStatus(data.message || 'Generating...');
      }

      if (data.type === 'full_refresh') {
        window.location.reload();
      }
    }

    function updateSlide(slideId, html) {
      const container = document.getElementById('slides-container');
      let slide = document.querySelector(\`[data-slide="\${slideId}"]\`);

      if (slide) {
        slide.innerHTML = html + \`<div class="slide-number">\${slideId}</div>\`;
      } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'slide-wrapper';
        wrapper.innerHTML = \`
          <div class="slide" data-slide="\${slideId}">
            \${html}
            <div class="slide-number">\${slideId}</div>
          </div>
        \`;
        container.appendChild(wrapper);
      }

      totalSlides = document.querySelectorAll('.slide').length;
      updateNav();
      initEditing();
    }

    function initEditing() {
      document.querySelectorAll('.slide-title, .slide-subtitle, .slide-text, h1, h2, h3, p, li').forEach(el => {
        if (!el.closest('.toolbar') && !el.closest('.nav')) {
          el.setAttribute('contenteditable', 'true');
        }
      });
    }

    function initKeyboard() {
      document.addEventListener('keydown', (e) => {
        if (document.activeElement?.getAttribute('contenteditable') === 'true') return;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextSlide();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevSlide();
      });
    }

    function nextSlide() {
      if (currentSlide < totalSlides) {
        currentSlide++;
        scrollToSlide(currentSlide);
        updateNav();
      }
    }

    function prevSlide() {
      if (currentSlide > 1) {
        currentSlide--;
        scrollToSlide(currentSlide);
        updateNav();
      }
    }

    function scrollToSlide(num) {
      const slide = document.querySelector(\`[data-slide="\${num}"]\`);
      if (slide) {
        slide.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function updateNav() {
      document.getElementById('current-slide').textContent = currentSlide;
      document.getElementById('total-slides').textContent = totalSlides;
    }

    function saveChanges() {
      const slides = [];
      document.querySelectorAll('.slide').forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.querySelector('.slide-number')?.remove();
        slides.push({
          id: parseInt(slide.dataset.slide),
          html: clone.innerHTML
        });
      });

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'save', slides }));
      }

      showToast('Changes saved');
    }

    async function downloadImages() {
      showToast('Generating images...');

      const slides = document.querySelectorAll('.slide');
      const zip = new JSZip();

      // Temporarily scale up for higher quality
      const originalStyles = [];
      slides.forEach((slide, i) => {
        originalStyles[i] = {
          width: slide.style.width,
          height: slide.style.height,
          transform: slide.style.transform
        };
        slide.style.width = '1280px';
        slide.style.height = '720px';
        slide.style.transform = 'none';
      });

      for (let i = 0; i < slides.length; i++) {
        const canvas = await html2canvas(slides[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        zip.file(\`slide-\${String(i + 1).padStart(2, '0')}.png\`, blob);
      }

      // Restore original styles
      slides.forEach((slide, i) => {
        slide.style.width = originalStyles[i].width;
        slide.style.height = originalStyles[i].height;
        slide.style.transform = originalStyles[i].transform;
      });

      const content = await zip.generateAsync({ type: 'blob' });
      downloadBlob(content, 'deck-images.zip');

      showToast('Images downloaded');
    }

    async function downloadPPTX() {
      showToast('Generating PowerPoint...');

      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.title = document.getElementById('deck-title')?.textContent || 'Deck';

      const slides = document.querySelectorAll('.slide');

      // Temporarily scale up for capture
      const originalStyles = [];
      slides.forEach((slide, i) => {
        originalStyles[i] = {
          width: slide.style.width,
          height: slide.style.height,
          transform: slide.style.transform
        };
        slide.style.width = '1280px';
        slide.style.height = '720px';
        slide.style.transform = 'none';
      });

      for (const slide of slides) {
        const pptxSlide = pptx.addSlide();

        const canvas = await html2canvas(slide, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        pptxSlide.addImage({
          data: canvas.toDataURL('image/png'),
          x: 0,
          y: 0,
          w: '100%',
          h: '100%'
        });
      }

      // Restore original styles
      slides.forEach((slide, i) => {
        slide.style.width = originalStyles[i].width;
        slide.style.height = originalStyles[i].height;
        slide.style.transform = originalStyles[i].transform;
      });

      await pptx.writeFile({ fileName: 'deck.pptx' });

      showToast('PowerPoint downloaded');
    }

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
      const text = document.getElementById('status-text');
      text.textContent = message;
      status.classList.add('active');
    }

    function hideStatus() {
      document.getElementById('status').classList.remove('active');
    }
  </script>
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

                  // Save the complete deck
                  const finalHTML = generateDeckHTML(topic, generatedSlides.map(h => `<div class="slide-content">${h}</div>`))
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
