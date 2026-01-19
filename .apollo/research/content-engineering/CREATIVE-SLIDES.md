# Creative Slide Templates

Full HTML/CSS slide templates with advanced animations and effects.

---

## 1. Hero Slide with Aurora Background

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .slide-hero {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      position: relative;
      overflow: hidden;
      background: #0f172a;
      font-family: 'Inter', system-ui, sans-serif;
      color: white;
    }

    /* Aurora background */
    .aurora {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .aurora-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.6;
      animation: auroraFloat 20s ease-in-out infinite;
    }

    .aurora-blob:nth-child(1) {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, #3b82f6, transparent 70%);
      top: -200px;
      left: -100px;
    }

    .aurora-blob:nth-child(2) {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #8b5cf6, transparent 70%);
      top: 50%;
      right: -100px;
      animation-delay: -7s;
    }

    .aurora-blob:nth-child(3) {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, #ec4899, transparent 70%);
      bottom: -100px;
      left: 30%;
      animation-delay: -14s;
    }

    @keyframes auroraFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(50px, 30px) scale(1.1); }
      50% { transform: translate(20px, 60px) scale(0.95); }
      75% { transform: translate(-30px, 20px) scale(1.05); }
    }

    /* Content */
    .content {
      position: relative;
      z-index: 1;
    }

    .title {
      font-size: clamp(3rem, 8vw, 6rem);
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 24px;
      background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: fadeInUp 1s ease-out;
    }

    .subtitle {
      font-size: clamp(1.25rem, 2.5vw, 1.75rem);
      color: #94a3b8;
      max-width: 600px;
      animation: fadeInUp 1s ease-out 0.2s backwards;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
</head>
<body>
  <div class="slide-hero">
    <div class="aurora">
      <div class="aurora-blob"></div>
      <div class="aurora-blob"></div>
      <div class="aurora-blob"></div>
    </div>
    <div class="content">
      <h1 class="title">Build the Future</h1>
      <p class="subtitle">Transform your ideas into reality with cutting-edge technology</p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Bento Grid Feature Slide

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .slide-bento {
      width: 100vw;
      height: 100vh;
      padding: 48px;
      background: #0f172a;
      font-family: 'Inter', system-ui, sans-serif;
      color: white;
    }

    .heading {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 32px;
    }

    .bento-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 16px;
      height: calc(100% - 80px);
    }

    .bento-item {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      overflow: hidden;
      position: relative;
    }

    .bento-item::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent);
      opacity: 0;
      transition: opacity 0.4s;
    }

    .bento-item:hover {
      transform: translateY(-8px);
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .bento-item:hover::before {
      opacity: 1;
    }

    .bento-item.large {
      grid-column: span 2;
      grid-row: span 2;
    }

    .bento-item.wide {
      grid-column: span 2;
    }

    .bento-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 16px;
    }

    .bento-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .bento-desc {
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .bento-item.large .bento-title {
      font-size: 1.75rem;
    }

    /* Staggered animation */
    .bento-item:nth-child(1) { animation: fadeIn 0.6s ease-out 0.1s backwards; }
    .bento-item:nth-child(2) { animation: fadeIn 0.6s ease-out 0.2s backwards; }
    .bento-item:nth-child(3) { animation: fadeIn 0.6s ease-out 0.3s backwards; }
    .bento-item:nth-child(4) { animation: fadeIn 0.6s ease-out 0.4s backwards; }
    .bento-item:nth-child(5) { animation: fadeIn 0.6s ease-out 0.5s backwards; }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
    }
  </style>
</head>
<body>
  <div class="slide-bento">
    <h2 class="heading">Key Features</h2>
    <div class="bento-grid">
      <div class="bento-item large">
        <div>
          <div class="bento-icon">⚡</div>
          <h3 class="bento-title">Lightning Fast</h3>
          <p class="bento-desc">Built for speed with optimized performance at every level. Experience response times under 100ms.</p>
        </div>
      </div>
      <div class="bento-item">
        <div class="bento-icon">🔒</div>
        <h3 class="bento-title">Secure</h3>
        <p class="bento-desc">Enterprise-grade security built in.</p>
      </div>
      <div class="bento-item">
        <div class="bento-icon">🔄</div>
        <h3 class="bento-title">Auto Sync</h3>
        <p class="bento-desc">Real-time synchronization.</p>
      </div>
      <div class="bento-item wide">
        <div class="bento-icon">📊</div>
        <h3 class="bento-title">Advanced Analytics</h3>
        <p class="bento-desc">Deep insights with beautiful dashboards and reports.</p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 3. Animated Stats Slide

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .slide-stats {
      width: 100vw;
      height: 100vh;
      padding: 64px;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      font-family: 'Inter', system-ui, sans-serif;
      color: white;
      display: flex;
      flex-direction: column;
    }

    .heading {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 64px;
      text-align: center;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 48px;
      flex: 1;
      align-content: center;
    }

    .stat-card {
      text-align: center;
      padding: 48px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 0 0 4px 4px;
    }

    .stat-value {
      font-size: 4.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      position: relative;
    }

    .stat-label {
      font-size: 1.25rem;
      color: #94a3b8;
      margin-top: 16px;
    }

    /* Counter animation */
    .stat-card:nth-child(1) { animation: slideUp 0.8s ease-out 0.1s backwards; }
    .stat-card:nth-child(2) { animation: slideUp 0.8s ease-out 0.3s backwards; }
    .stat-card:nth-child(3) { animation: slideUp 0.8s ease-out 0.5s backwards; }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
    }

    /* Number count-up effect (JS enhanced) */
    .stat-value {
      animation: countPulse 0.5s ease-out;
    }

    @keyframes countPulse {
      0% { transform: scale(0.5); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }

    /* Glow ring animation */
    .stat-card::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 26px;
      background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6);
      background-size: 400% 400%;
      z-index: -1;
      opacity: 0;
      transition: opacity 0.3s;
      animation: borderGlow 3s linear infinite;
    }

    .stat-card:hover::after {
      opacity: 1;
    }

    @keyframes borderGlow {
      0% { background-position: 0% 50%; }
      100% { background-position: 400% 50%; }
    }
  </style>
</head>
<body>
  <div class="slide-stats">
    <h2 class="heading">Impact at Scale</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">10M+</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">99.9%</div>
        <div class="stat-label">Uptime</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">50ms</div>
        <div class="stat-label">Avg Response</div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 4. Glass Card Showcase

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .slide-glass {
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Inter', system-ui, sans-serif;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      perspective: 1000px;
    }

    .glass-container {
      display: flex;
      gap: 32px;
    }

    .glass-card {
      width: 300px;
      height: 400px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      overflow: hidden;
    }

    .glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg,
        transparent,
        rgba(255, 255, 255, 0.5),
        transparent);
    }

    .glass-card:hover {
      transform: translateY(-20px) rotateX(5deg);
      box-shadow:
        0 40px 80px rgba(0, 0, 0, 0.3),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    }

    .glass-card:nth-child(1) { animation: cardFloat 0.8s ease-out 0.1s backwards; }
    .glass-card:nth-child(2) { animation: cardFloat 0.8s ease-out 0.2s backwards; }
    .glass-card:nth-child(3) { animation: cardFloat 0.8s ease-out 0.3s backwards; }

    @keyframes cardFloat {
      from {
        opacity: 0;
        transform: translateY(60px) rotateX(-10deg);
      }
    }

    .card-icon {
      width: 64px;
      height: 64px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 24px;
    }

    .card-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .card-desc {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
      flex: 1;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .card-link {
      color: white;
      text-decoration: none;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: gap 0.3s;
    }

    .card-link:hover {
      gap: 16px;
    }

    /* Floating shapes background */
    .slide-glass::before,
    .slide-glass::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
    }

    .slide-glass::before {
      width: 400px;
      height: 400px;
      top: -100px;
      left: -100px;
      animation: floatBg 15s ease-in-out infinite;
    }

    .slide-glass::after {
      width: 300px;
      height: 300px;
      bottom: -50px;
      right: -50px;
      animation: floatBg 20s ease-in-out infinite reverse;
    }

    @keyframes floatBg {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(50px, 50px); }
    }
  </style>
</head>
<body>
  <div class="slide-glass">
    <div class="glass-container">
      <div class="glass-card">
        <div class="card-icon">🚀</div>
        <h3 class="card-title">Quick Start</h3>
        <p class="card-desc">Get up and running in minutes with our simple setup process.</p>
        <div class="card-footer">
          <a href="#" class="card-link">Learn more →</a>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-icon">⚙️</div>
        <h3 class="card-title">Flexible</h3>
        <p class="card-desc">Customize every aspect to fit your unique workflow needs.</p>
        <div class="card-footer">
          <a href="#" class="card-link">Learn more →</a>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-icon">💎</div>
        <h3 class="card-title">Premium</h3>
        <p class="card-desc">Enterprise features with dedicated support and SLA.</p>
        <div class="card-footer">
          <a href="#" class="card-link">Learn more →</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 5. Animated Timeline Slide

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .slide-timeline {
      width: 100vw;
      height: 100vh;
      padding: 64px;
      background: #0f172a;
      font-family: 'Inter', system-ui, sans-serif;
      color: white;
    }

    .heading {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 64px;
      text-align: center;
    }

    .timeline {
      position: relative;
      max-width: 1000px;
      margin: 0 auto;
    }

    /* Center line */
    .timeline::before {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, #3b82f6, #8b5cf6);
      border-radius: 2px;
    }

    .timeline-item {
      display: flex;
      justify-content: flex-end;
      padding-right: calc(50% + 40px);
      position: relative;
      margin-bottom: 48px;
    }

    .timeline-item:nth-child(even) {
      justify-content: flex-start;
      padding-right: 0;
      padding-left: calc(50% + 40px);
    }

    /* Timeline dot */
    .timeline-item::before {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 20px;
      background: #3b82f6;
      border: 4px solid #0f172a;
      border-radius: 50%;
      z-index: 1;
    }

    .timeline-content {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      position: relative;
    }

    /* Arrow */
    .timeline-item:nth-child(odd) .timeline-content::after {
      content: '';
      position: absolute;
      right: -10px;
      top: 20px;
      border: 10px solid transparent;
      border-left-color: rgba(255, 255, 255, 0.1);
    }

    .timeline-item:nth-child(even) .timeline-content::after {
      content: '';
      position: absolute;
      left: -10px;
      top: 20px;
      border: 10px solid transparent;
      border-right-color: rgba(255, 255, 255, 0.1);
    }

    .timeline-date {
      color: #3b82f6;
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 8px;
    }

    .timeline-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .timeline-desc {
      color: #94a3b8;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    /* Animations */
    .timeline-item:nth-child(1) { animation: slideInLeft 0.6s ease-out 0.1s backwards; }
    .timeline-item:nth-child(2) { animation: slideInRight 0.6s ease-out 0.3s backwards; }
    .timeline-item:nth-child(3) { animation: slideInLeft 0.6s ease-out 0.5s backwards; }
    .timeline-item:nth-child(4) { animation: slideInRight 0.6s ease-out 0.7s backwards; }

    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-50px);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(50px);
      }
    }

    /* Pulse animation on dots */
    .timeline-item::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 20px;
      background: #3b82f6;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
      opacity: 0;
    }

    @keyframes pulse {
      0% { transform: translateX(-50%) scale(1); opacity: 0.5; }
      100% { transform: translateX(-50%) scale(2.5); opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="slide-timeline">
    <h2 class="heading">Our Journey</h2>
    <div class="timeline">
      <div class="timeline-item">
        <div class="timeline-content">
          <div class="timeline-date">Q1 2024</div>
          <h3 class="timeline-title">Launch</h3>
          <p class="timeline-desc">Started with a simple idea and a small team.</p>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-content">
          <div class="timeline-date">Q2 2024</div>
          <h3 class="timeline-title">First Million</h3>
          <p class="timeline-desc">Reached our first million users milestone.</p>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-content">
          <div class="timeline-date">Q3 2024</div>
          <h3 class="timeline-title">Series A</h3>
          <p class="timeline-desc">Raised $10M to accelerate growth.</p>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-content">
          <div class="timeline-date">Q4 2024</div>
          <h3 class="timeline-title">Global</h3>
          <p class="timeline-desc">Expanded to 50+ countries worldwide.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 6. 3D Card Flip Comparison

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .slide-compare {
      width: 100vw;
      height: 100vh;
      padding: 64px;
      background: #0f172a;
      font-family: 'Inter', system-ui, sans-serif;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .heading {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 48px;
    }

    .compare-container {
      display: flex;
      gap: 64px;
    }

    .flip-card {
      width: 350px;
      height: 450px;
      perspective: 1000px;
      cursor: pointer;
    }

    .flip-card-inner {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
      border-radius: 24px;
      padding: 32px;
      display: flex;
      flex-direction: column;
    }

    .flip-card-front {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .flip-card-back {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      transform: rotateY(180deg);
    }

    .flip-card:nth-child(2) .flip-card-front {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    }

    .flip-card:nth-child(2) .flip-card-back {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .card-label {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.8;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 24px;
    }

    .card-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }

    .card-list li {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1rem;
    }

    .card-list li::before {
      content: '✕';
      font-weight: bold;
    }

    .flip-card-back .card-list li::before {
      content: '✓';
    }

    .flip-hint {
      font-size: 0.875rem;
      opacity: 0.7;
      text-align: center;
      margin-top: auto;
    }

    /* Entry animation */
    .flip-card:nth-child(1) { animation: cardEnter 0.8s ease-out 0.1s backwards; }
    .flip-card:nth-child(2) { animation: cardEnter 0.8s ease-out 0.3s backwards; }

    @keyframes cardEnter {
      from {
        opacity: 0;
        transform: translateY(40px) rotateX(-10deg);
      }
    }
  </style>
</head>
<body>
  <div class="slide-compare">
    <h2 class="heading">Before vs After</h2>
    <div class="compare-container">
      <div class="flip-card">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <span class="card-label">Before</span>
            <h3 class="card-title">Old Way</h3>
            <ul class="card-list">
              <li>Manual processes</li>
              <li>Hours of work</li>
              <li>Error prone</li>
              <li>No visibility</li>
            </ul>
            <p class="flip-hint">Hover to see the solution →</p>
          </div>
          <div class="flip-card-back">
            <span class="card-label">After</span>
            <h3 class="card-title">New Way</h3>
            <ul class="card-list">
              <li>Fully automated</li>
              <li>Done in seconds</li>
              <li>99.9% accuracy</li>
              <li>Full transparency</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="flip-card">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <span class="card-label">Problem</span>
            <h3 class="card-title">Pain Points</h3>
            <ul class="card-list">
              <li>Scattered data</li>
              <li>No real-time updates</li>
              <li>Poor collaboration</li>
              <li>Security risks</li>
            </ul>
            <p class="flip-hint">Hover to see the solution →</p>
          </div>
          <div class="flip-card-back">
            <span class="card-label">Solution</span>
            <h3 class="card-title">Our Platform</h3>
            <ul class="card-list">
              <li>Unified dashboard</li>
              <li>Live synchronization</li>
              <li>Team workspaces</li>
              <li>Enterprise security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## Quick Animation Cheatsheet

| Effect | Use Case | CSS Property |
|--------|----------|--------------|
| Fade In | Reveals | `opacity` + `transform` |
| Slide Up | Lists, cards | `translateY` |
| Scale | Buttons, hover | `scale` |
| Rotate | Icons, flip | `rotate` / `rotateY` |
| Blur | Focus, glass | `filter: blur()` |
| Gradient | Backgrounds | `background-position` |
| Glow | Highlights | `box-shadow` |

## Animation Timing Recommendations

| Duration | Use For |
|----------|---------|
| 0.1-0.2s | Micro-interactions (hover, focus) |
| 0.3-0.5s | UI transitions (modals, dropdowns) |
| 0.6-0.8s | Content reveals (slides, cards) |
| 1-2s | Complex animations (page transitions) |
| 3s+ | Background effects (aurora, gradients) |
