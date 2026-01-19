<p align="center">
  <a href="https://github.com/i-luv-pho/apollov2">
    <picture>
      <source srcset="packages/identity/mark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/identity/mark-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/identity/mark.svg" alt="Apollo v2 logo" width="120">
    </picture>
  </a>
</p>
<h1 align="center">Apollo v2</h1>
<p align="center"><strong>Illuminating your code</strong></p>
<p align="center">AI-powered development tool by Metamorphosis Labs</p>

---

### Installation

```bash
# Package managers
npm i -g apollov2@latest        # or bun/pnpm/yarn

# Or via install script
curl -fsSL https://raw.githubusercontent.com/i-luv-pho/apollov2/main/install | bash
```

### Desktop App

Apollo v2 is available as a desktop application. Download directly from the [releases page](https://github.com/i-luv-pho/apollov2/releases).

| Platform              | Download                          |
| --------------------- | --------------------------------- |
| macOS (Apple Silicon) | `apollov2-desktop-darwin-aarch64.dmg` |
| macOS (Intel)         | `apollov2-desktop-darwin-x64.dmg`     |
| Windows               | `apollov2-desktop-windows-x64.exe`    |
| Linux                 | `.deb`, `.rpm`, or AppImage         |

### Features

Apollo includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

### Development

```bash
# Install dependencies
bun install

# Run development server
cd packages/desktop
bun run dev
```

### Building

```bash
# Build for macOS
cd packages/desktop
bun run tauri build

# Output: packages/desktop/src-tauri/target/release/bundle/dmg/Apollov2.dmg
```

---

<p align="center">
  <strong>Apollo v2 by Metamorphosis Labs</strong><br>
  Illuminating your code
</p>
