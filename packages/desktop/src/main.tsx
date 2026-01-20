/* @refresh reload */
import { render } from "solid-js/web"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-shell"
import { relaunch } from "@tauri-apps/plugin-process"
import { sendNotification } from "@tauri-apps/plugin-notification"
import { LazyStore } from "@tauri-apps/plugin-store"
import type { Platform } from "@apollo-ai/app/context/platform"

// Import the app entry point and styles
import App from "@apollo-ai/app/app"
import "@apollo-ai/app/index.css"

// Initialize store for persistent settings
const store = new LazyStore("settings.json")

/**
 * Desktop Platform Implementation
 * Implements the Platform interface using Tauri APIs
 */
const desktopPlatform: Platform = {
  platform: "desktop",

  // OS detection via Tauri command
  os: await invoke<"macos" | "windows" | "linux">("get_os"),

  // App version from Tauri
  version: await invoke<string>("get_version"),

  // Open URL in default browser
  openLink: (url: string) => {
    open(url)
  },

  // Restart the application
  restart: async () => {
    await relaunch()
  },

  // Send system notification
  notify: async (title: string, description?: string, _href?: string) => {
    await sendNotification({
      title,
      body: description,
    })
  },

  // Open directory picker dialog
  openDirectoryPickerDialog: async (opts) => {
    const result = await invoke<string[] | null>("open_directory_picker", {
      title: opts?.title,
      multiple: opts?.multiple,
    })

    if (!result) return null
    return opts?.multiple ? result : result[0]
  },

  // Open file picker dialog
  openFilePickerDialog: async (opts) => {
    const result = await invoke<string[] | null>("open_file_picker", {
      title: opts?.title,
      multiple: opts?.multiple,
    })

    if (!result) return null
    return opts?.multiple ? result : result[0]
  },

  // Save file picker dialog
  saveFilePickerDialog: async (opts) => {
    return invoke<string | null>("save_file_picker", {
      title: opts?.title,
      defaultPath: opts?.defaultPath,
    })
  },

  // Persistent storage using Tauri store plugin
  storage: (_name?: string) => ({
    getItem: async (key: string) => {
      const value = await store.get<string>(key)
      return value ?? null
    },
    setItem: async (key: string, value: string) => {
      await store.set(key, value)
      await store.save()
    },
    removeItem: async (key: string) => {
      await store.delete(key)
      await store.save()
    },
  }),

  // Check for updates
  checkUpdate: async () => {
    const result = await invoke<{ update_available: boolean; version?: string }>("check_update")
    return {
      updateAvailable: result.update_available,
      version: result.version,
    }
  },

  // Install update
  update: async () => {
    await invoke("install_update")
  },

  // Get default server URL from settings
  getDefaultServerUrl: async () => {
    return invoke<string | null>("get_default_server_url")
  },

  // Set default server URL in settings
  setDefaultServerUrl: async (url: string | null) => {
    await invoke("set_default_server_url", { url })
  },
}

// Mount the application
const root = document.getElementById("root")

if (root) {
  render(() => <App platform={desktopPlatform} />, root)
}
