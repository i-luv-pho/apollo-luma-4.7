<p align="center">
  <a href="https://github.com/i-luv-pho/apollov2">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="Apollo logo">
    </picture>
  </a>
</p>
<p align="center">开源的 AI Coding Agent。</p>
<p align="center">
  <a href="https://github.com/i-luv-pho/apollov2/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/apollo-ai"><img alt="npm" src="https://img.shields.io/npm/v/apollo-ai?style=flat-square" /></a>
  <a href="https://github.com/i-luv-pho/apollov2/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/i-luv-pho/apollov2/publish.yml?style=flat-square&branch=dev" /></a>
</p>

[![Apollo Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://github.com/i-luv-pho/apollov2)

---

### 安装

```bash
# 直接安装 (YOLO)
curl -fsSL https://github.com/i-luv-pho/apollov2/install | bash

# 软件包管理器
npm i -g apollo-ai@latest        # 也可使用 bun/pnpm/yarn
scoop bucket add extras; scoop install extras/apollo  # Windows
choco install apollo             # Windows
brew install i-luv-pho/tap/apollo # macOS 和 Linux（推荐，始终保持最新）
brew install apollo              # macOS 和 Linux（官方 brew formula，更新频率较低）
paru -S apollo-bin               # Arch Linux
mise use -g apollo               # 任意系统
nix run nixpkgs#apollo           # 或用 github:i-luv-pho/apollov2 获取最新 dev 分支
```

> [!TIP]
> 安装前请先移除 0.1.x 之前的旧版本。

### 桌面应用程序 (BETA)

Apollo 也提供桌面版应用。可直接从 [发布页 (releases page)](https://github.com/i-luv-pho/apollov2/releases) 或 [github.com/i-luv-pho/apollov2/download](https://github.com/i-luv-pho/apollov2/download) 下载。

| 平台                  | 下载文件                              |
| --------------------- | ------------------------------------- |
| macOS (Apple Silicon) | `apollo-desktop-darwin-aarch64.dmg` |
| macOS (Intel)         | `apollo-desktop-darwin-x64.dmg`     |
| Windows               | `apollo-desktop-windows-x64.exe`    |
| Linux                 | `.deb`、`.rpm` 或 AppImage            |

```bash
# macOS (Homebrew Cask)
brew install --cask apollo-desktop
```

#### 安装目录

安装脚本按照以下优先级决定安装路径：

1. `$APOLLO_INSTALL_DIR` - 自定义安装目录
2. `$XDG_BIN_DIR` - 符合 XDG 基础目录规范的路径
3. `$HOME/bin` - 如果存在或可创建的用户二进制目录
4. `$HOME/.apollo/bin` - 默认备用路径

```bash
# 示例
APOLLO_INSTALL_DIR=/usr/local/bin curl -fsSL https://github.com/i-luv-pho/apollov2/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://github.com/i-luv-pho/apollov2/install | bash
```

### Agents

Apollo 内置两种 Agent，可用 `Tab` 键快速切换：

- **build** - 默认模式，具备完整权限，适合开发工作
- **plan** - 只读模式，适合代码分析与探索
  - 默认拒绝修改文件
  - 运行 bash 命令前会询问
  - 便于探索未知代码库或规划改动

另外还包含一个 **general** 子 Agent，用于复杂搜索和多步任务，内部使用，也可在消息中输入 `@general` 调用。

了解更多 [Agents](https://github.com/i-luv-pho/apollov2/docs/agents) 相关信息。

### 文档

更多配置说明请查看我们的 [**官方文档**](https://github.com/i-luv-pho/apollov2/docs)。

### 参与贡献

如有兴趣贡献代码，请在提交 PR 前阅读 [贡献指南 (Contributing Docs)](./CONTRIBUTING.md)。

### 基于 Apollo 进行开发

如果你在项目名中使用了 “apollo”（如 “apollo-dashboard” 或 “apollo-mobile”），请在 README 里注明该项目不是 Apollo 团队官方开发，且不存在隶属关系。

### 常见问题 (FAQ)

#### Apollo 有什么特点？

Apollo 是一款功能强大的开源 AI 编程助手，具备以下特点：

- 100% 开源。
- 不绑定特定提供商。可搭配 OpenAI、Google 甚至本地模型使用。
- 内置 LSP（语言服务器协议）支持。
- 聚焦终端界面 (TUI)。Apollo 由 Neovim 爱好者和 [terminal.shop](https://terminal.shop) 的创建者打造，会持续探索终端的极限。
- 客户端/服务器架构。可在本机运行，同时用移动设备远程驱动。

---

**加入我们的社区** [Discord](https://discord.gg/apollo) | [X.com](https://x.com/apollo)
