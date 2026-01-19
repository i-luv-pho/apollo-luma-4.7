<p align="center">
  <a href="https://github.com/i-luv-pho/apollov2">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="Apollo logo">
    </picture>
  </a>
</p>
<p align="center">開源的 AI Coding Agent。</p>
<p align="center">
  <a href="https://github.com/i-luv-pho/apollov2/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/apollo-ai"><img alt="npm" src="https://img.shields.io/npm/v/apollo-ai?style=flat-square" /></a>
  <a href="https://github.com/i-luv-pho/apollov2/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/i-luv-pho/apollov2/publish.yml?style=flat-square&branch=dev" /></a>
</p>

[![Apollo Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://github.com/i-luv-pho/apollov2)

---

### 安裝

```bash
# 直接安裝 (YOLO)
curl -fsSL https://github.com/i-luv-pho/apollov2/install | bash

# 套件管理員
npm i -g apollo-ai@latest        # 也可使用 bun/pnpm/yarn
scoop bucket add extras; scoop install extras/apollo  # Windows
choco install apollo             # Windows
brew install i-luv-pho/tap/apollo # macOS 與 Linux（推薦，始終保持最新）
brew install apollo              # macOS 與 Linux（官方 brew formula，更新頻率較低）
paru -S apollo-bin               # Arch Linux
mise use -g github:i-luv-pho/apollov2    # 任何作業系統
nix run nixpkgs#apollo           # 或使用 github:i-luv-pho/apollov2 以取得最新開發分支
```

> [!TIP]
> 安裝前請先移除 0.1.x 以前的舊版本。

### 桌面應用程式 (BETA)

Apollo 也提供桌面版應用程式。您可以直接從 [發佈頁面 (releases page)](https://github.com/i-luv-pho/apollov2/releases) 或 [github.com/i-luv-pho/apollov2/download](https://github.com/i-luv-pho/apollov2/download) 下載。

| 平台                  | 下載連結                              |
| --------------------- | ------------------------------------- |
| macOS (Apple Silicon) | `apollo-desktop-darwin-aarch64.dmg` |
| macOS (Intel)         | `apollo-desktop-darwin-x64.dmg`     |
| Windows               | `apollo-desktop-windows-x64.exe`    |
| Linux                 | `.deb`, `.rpm`, 或 AppImage           |

```bash
# macOS (Homebrew Cask)
brew install --cask apollo-desktop
```

#### 安裝目錄

安裝腳本會依據以下優先順序決定安裝路徑：

1. `$APOLLO_INSTALL_DIR` - 自定義安裝目錄
2. `$XDG_BIN_DIR` - 符合 XDG 基礎目錄規範的路徑
3. `$HOME/bin` - 標準使用者執行檔目錄 (若存在或可建立)
4. `$HOME/.apollo/bin` - 預設備用路徑

```bash
# 範例
APOLLO_INSTALL_DIR=/usr/local/bin curl -fsSL https://github.com/i-luv-pho/apollov2/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://github.com/i-luv-pho/apollov2/install | bash
```

### Agents

Apollo 內建了兩種 Agent，您可以使用 `Tab` 鍵快速切換。

- **build** - 預設模式，具備完整權限的 Agent，適用於開發工作。
- **plan** - 唯讀模式，適用於程式碼分析與探索。
  - 預設禁止修改檔案。
  - 執行 bash 指令前會詢問權限。
  - 非常適合用來探索陌生的程式碼庫或規劃變更。

此外，Apollo 還包含一個 **general** 子 Agent，用於處理複雜搜尋與多步驟任務。此 Agent 供系統內部使用，亦可透過在訊息中輸入 `@general` 來呼叫。

了解更多關於 [Agents](https://github.com/i-luv-pho/apollov2/docs/agents) 的資訊。

### 線上文件

關於如何設定 Apollo 的詳細資訊，請參閱我們的 [**官方文件**](https://github.com/i-luv-pho/apollov2/docs)。

### 參與貢獻

如果您有興趣參與 Apollo 的開發，請在提交 Pull Request 前先閱讀我們的 [貢獻指南 (Contributing Docs)](./CONTRIBUTING.md)。

### 基於 Apollo 進行開發

如果您正在開發與 Apollo 相關的專案，並在名稱中使用了 "apollo"（例如 "apollo-dashboard" 或 "apollo-mobile"），請在您的 README 中加入聲明，說明該專案並非由 Apollo 團隊開發，且與我們沒有任何隸屬關係。

### 常見問題 (FAQ)

#### Apollo 有什麼特色？

Apollo 是一款功能強大的開源 AI 編程助手，具備以下特色：

- 100% 開源。
- 不綁定特定的服務提供商。可搭配 OpenAI, Google 甚至本地模型使用。
- 內建 LSP (語言伺服器協定) 支援。
- 專注於終端機介面 (TUI)。Apollo 由 Neovim 愛好者與 [terminal.shop](https://terminal.shop) 的創作者打造；我們將不斷挑戰終端機介面的極限。
- 客戶端/伺服器架構 (Client/Server Architecture)。這讓 Apollo 能夠在您的電腦上運行的同時，由行動裝置進行遠端操控。

---

**加入我們的社群** [Discord](https://discord.gg/apollo) | [X.com](https://x.com/apollo)
