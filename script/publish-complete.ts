#!/usr/bin/env bun

import { Script } from "@apollo-ai/script"
import { $ } from "bun"

try {
  if (!Script.preview) {
    await $`gh release edit v${Script.version} --draft=false`
  }

  await $`bun install`

  await $`gh release download --pattern "apollo-linux-*64.tar.gz" --pattern "apollo-darwin-*64.zip" -D dist`

  await import(`../packages/apollo/script/publish-registries.ts`)
} catch (error) {
  console.error("Publish failed:", error instanceof Error ? error.message : String(error))
  process.exit(1)
}
