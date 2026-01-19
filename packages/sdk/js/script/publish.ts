#!/usr/bin/env bun

import { Script } from "@apollo-ai/script"
import { $ } from "bun"

const dir = new URL("..", import.meta.url).pathname
process.chdir(dir)

await import("./build")

const hasNpmToken = !!process.env.NPM_TOKEN && process.env.NPM_TOKEN.length > 0

if (hasNpmToken) {
  const pkg = await import("../package.json").then((m) => m.default)
  const original = JSON.parse(JSON.stringify(pkg))
  for (const [key, value] of Object.entries(pkg.exports)) {
    const file = value.replace("./src/", "./dist/").replace(".ts", "")
    /// @ts-expect-error
    pkg.exports[key] = {
      import: file + ".js",
      types: file + ".d.ts",
    }
  }
  await Bun.write("package.json", JSON.stringify(pkg, null, 2))
  await $`bun pm pack`
  await $`npm publish *.tgz --tag ${Script.channel} --access public`
  await Bun.write("package.json", JSON.stringify(original, null, 2))
} else {
  console.log("Skipping SDK npm publish (no NPM_TOKEN)")
}
