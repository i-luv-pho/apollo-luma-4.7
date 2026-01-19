import { createSimpleContext } from "./helper"
import { createVimMode, type VimModeController } from "../component/vim-mode"
import { useKV } from "./kv"
import { createEffect } from "solid-js"

export const { use: useVim, provider: VimProvider } = createSimpleContext({
  name: "Vim",
  init: () => {
    const kv = useKV()

    // Get initial vim state from persistent storage
    const initialEnabled = kv.get("vim_enabled", false)

    const vim = createVimMode({ initialEnabled })

    // Persist vim enabled state
    createEffect(() => {
      if (kv.ready) {
        kv.set("vim_enabled", vim.enabled)
      }
    })

    return vim
  },
})
