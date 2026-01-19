#!/usr/bin/env bun

import { $ } from "bun"
import { Script } from "@apollo-ai/script"
import { buildNotes, getLatestRelease } from "./changelog"

console.log("=== Publishing Apollo ===\n")

// Get changelog
let notes: string[] = []
if (!Script.preview) {
  const previous = await getLatestRelease()
  notes = await buildNotes(previous, "HEAD")
}

// Update all package.json versions
const pkgjsons = await Array.fromAsync(
  new Bun.Glob("**/package.json").scan({ absolute: true })
).then((arr) => arr.filter((x) => !x.includes("node_modules") && !x.includes("dist")))

for (const file of pkgjsons) {
  let pkg = await Bun.file(file).text()
  pkg = pkg.replaceAll(/"version": "[^"]+"/g, `"version": "${Script.version}"`)
  console.log("updated:", file)
  await Bun.file(file).write(pkg)
}

await $`bun install`

// Build macOS binaries only
console.log("\n=== Building macOS binaries ===\n")
process.chdir(new URL("../packages/apollo", import.meta.url).pathname)

// Set env to only build macOS
process.env.APOLLO_MACOS_ONLY = "true"
const { binaries } = await import("../packages/apollo/script/build.ts")

// Create zip archives
for (const key of Object.keys(binaries)) {
  if (key.includes("darwin")) {
    await $`zip -r ../../${key}.zip *`.cwd(`dist/${key}/bin`)
  }
}

// Create GitHub release
console.log("\n=== Creating release ===\n")
process.chdir(new URL("..", import.meta.url).pathname)

if (!Script.preview) {
  await $`git commit -am "release: v${Script.version}"`
  await $`git tag v${Script.version}`
  await $`git push origin HEAD --tags --no-verify --force-with-lease`
  await new Promise((r) => setTimeout(r, 5000))
  await $`gh release create v${Script.version} --title "v${Script.version}" --notes ${notes.join("\n") || "No notable changes"} ./packages/apollo/dist/*.zip`
}

// Update Homebrew tap
console.log("\n=== Updating Homebrew ===\n")

const arm64Sha = await $`shasum -a 256 ./packages/apollo/dist/apollo-darwin-arm64.zip | cut -d' ' -f1`.text().then((x) => x.trim())
const x64Sha = await $`shasum -a 256 ./packages/apollo/dist/apollo-darwin-x64.zip | cut -d' ' -f1`.text().then((x) => x.trim())

const formula = `# typed: false
# frozen_string_literal: true

class Apollo < Formula
  desc "AI coding agent for the terminal"
  homepage "https://github.com/i-luv-pho/apollov2"
  version "${Script.version}"

  depends_on "ripgrep"
  depends_on :macos

  if Hardware::CPU.arm?
    url "https://github.com/i-luv-pho/apollov2/releases/download/v${Script.version}/apollo-darwin-arm64.zip"
    sha256 "${arm64Sha}"
  else
    url "https://github.com/i-luv-pho/apollov2/releases/download/v${Script.version}/apollo-darwin-x64.zip"
    sha256 "${x64Sha}"
  end

  def install
    bin.install "apollo"
  end
end
`

if (!Script.preview) {
  await $`rm -rf ./dist/homebrew-tap`
  await $`gh repo clone i-luv-pho/homebrew-tap ./dist/homebrew-tap`
  await Bun.file("./dist/homebrew-tap/apollo.rb").write(formula)
  await $`cd ./dist/homebrew-tap && git add apollo.rb && git commit -m "Update to v${Script.version}" && git push`
}

console.log(`\n✅ Published Apollo v${Script.version}`)
