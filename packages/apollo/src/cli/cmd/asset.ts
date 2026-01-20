import type { Argv } from "yargs"
import path from "path"
import fs from "fs"
import { cmd } from "./cmd"
import { UI } from "../ui"
import { validateAccessKey, uploadAsset, getAssetsForKey, deleteAsset } from "../../deck/supabase"

export const AssetCommand = cmd({
  command: "asset <action>",
  describe: "Manage assets for deck generation",
  builder: (yargs: Argv) => {
    return yargs
      .positional("action", {
        describe: "Action to perform",
        type: "string",
        choices: ["upload", "list", "delete"] as const,
      })
      .option("file", {
        type: "string",
        alias: "f",
        describe: "File to upload (for upload action)",
      })
      .option("label", {
        type: "string",
        alias: "l",
        describe: "Label for the asset",
      })
      .option("description", {
        type: "string",
        alias: "d",
        describe: "Description of the asset",
      })
      .option("id", {
        type: "string",
        describe: "Asset ID (for delete action)",
      })
  },
  handler: async (args) => {
    const action = args.action as "upload" | "list" | "delete"

    // Check access key
    const accessKey = process.env.APOLLO_API_KEY
    if (!accessKey) {
      UI.error("Access key required")
      UI.println()
      UI.println("Set your access key:")
      UI.println(UI.Style.TEXT_INFO_BOLD + "  export APOLLO_API_KEY=sk_xxxxx" + UI.Style.TEXT_NORMAL)
      process.exit(1)
    }

    // Validate access key
    const validation = await validateAccessKey(accessKey)
    if (!validation.valid) {
      UI.error(validation.error || "Invalid access key")
      process.exit(1)
    }

    switch (action) {
      case "upload": {
        if (!args.file) {
          UI.error("File required: --file <path>")
          UI.println("Usage: apollo asset upload --file photo.png --label \"My photo\"")
          process.exit(1)
        }

        if (!args.label) {
          UI.error("Label required: --label <text>")
          UI.println("Usage: apollo asset upload --file photo.png --label \"My photo\"")
          process.exit(1)
        }

        const filePath = path.resolve(args.file)
        if (!fs.existsSync(filePath)) {
          UI.error(`File not found: ${filePath}`)
          process.exit(1)
        }

        const ext = path.extname(filePath).toLowerCase()
        const validExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]
        if (!validExts.includes(ext)) {
          UI.error(`Invalid file type. Supported: ${validExts.join(", ")}`)
          process.exit(1)
        }

        UI.println(UI.Style.TEXT_DIM + "Uploading..." + UI.Style.TEXT_NORMAL)

        const fileBuffer = fs.readFileSync(filePath)
        const fileName = path.basename(filePath)

        const result = await uploadAsset(
          accessKey,
          fileBuffer,
          fileName,
          args.label,
          args.description
        )

        if (!result.success) {
          UI.error(result.error || "Upload failed")
          process.exit(1)
        }

        UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + " Asset uploaded!")
        UI.println()
        UI.println(UI.Style.TEXT_DIM + "ID:    " + UI.Style.TEXT_NORMAL + result.asset!.id)
        UI.println(UI.Style.TEXT_DIM + "Label: " + UI.Style.TEXT_NORMAL + result.asset!.label)
        UI.println(UI.Style.TEXT_DIM + "URL:   " + UI.Style.TEXT_NORMAL + result.asset!.public_url)
        break
      }

      case "list": {
        const assets = await getAssetsForKey(accessKey)

        if (assets.length === 0) {
          UI.println(UI.Style.TEXT_DIM + "No assets uploaded yet." + UI.Style.TEXT_NORMAL)
          UI.println()
          UI.println("Upload your first asset:")
          UI.println(UI.Style.TEXT_INFO_BOLD + "  apollo asset upload --file photo.png --label \"My photo\"" + UI.Style.TEXT_NORMAL)
          break
        }

        UI.println(UI.Style.TEXT_HIGHLIGHT_BOLD + `${assets.length} asset(s)` + UI.Style.TEXT_NORMAL)
        UI.println()

        for (const asset of assets) {
          UI.println(UI.Style.TEXT_INFO_BOLD + asset.label + UI.Style.TEXT_NORMAL)
          if (asset.description) {
            UI.println(UI.Style.TEXT_DIM + "  " + asset.description + UI.Style.TEXT_NORMAL)
          }
          UI.println(UI.Style.TEXT_DIM + "  ID: " + asset.id + UI.Style.TEXT_NORMAL)
          UI.println(UI.Style.TEXT_DIM + "  URL: " + asset.public_url + UI.Style.TEXT_NORMAL)
          UI.println()
        }
        break
      }

      case "delete": {
        if (!args.id) {
          UI.error("Asset ID required: --id <uuid>")
          UI.println("Use 'apollo asset list' to see asset IDs")
          process.exit(1)
        }

        const result = await deleteAsset(accessKey, args.id)

        if (!result.success) {
          UI.error(result.error || "Delete failed")
          process.exit(1)
        }

        UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + " Asset deleted")
        break
      }
    }
  },
})
