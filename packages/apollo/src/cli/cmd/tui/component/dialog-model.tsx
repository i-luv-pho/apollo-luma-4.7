import { createMemo, createSignal } from "solid-js"
import { useLocal } from "@tui/context/local"
import { useSync } from "@tui/context/sync"
import { pipe, flatMap, entries, filter, map, sortBy } from "remeda"
import { DialogSelect, type DialogSelectRef } from "@tui/ui/dialog-select"
import { useDialog } from "@tui/ui/dialog"
import { createDialogProviderOptions, DialogProvider } from "./dialog-provider"
import { useKeybind } from "../context/keybind"

export function useConnected() {
  const sync = useSync()
  return createMemo(() =>
    sync.data.provider.some((x) => x.id === "apollo" && Object.keys(x.models).length > 0),
  )
}

export function DialogModel(props: { providerID?: string }) {
  const local = useLocal()
  const sync = useSync()
  const dialog = useDialog()
  const keybind = useKeybind()
  const [ref, setRef] = createSignal<DialogSelectRef<unknown>>()

  const connected = useConnected()

  const options = createMemo(() => {
    // Apollo models first (shown as "Luna 4.7")
    const apolloOptions = pipe(
      sync.data.provider.filter((x) => x.id === "apollo"),
      flatMap((provider) =>
        pipe(
          provider.models,
          entries(),
          filter(([_, info]) => info.status !== "deprecated"),
          filter(([model, _]) => !model.includes("-nano")),
          map(([model, info]) => ({
            value: {
              providerID: "apollo",
              modelID: model,
            },
            title: "Luna 4.7",
            category: "Apollo",
            footer: info.cost?.input === 0 ? "Free" : undefined,
            onSelect() {
              dialog.clear()
              local.model.set(
                { providerID: "apollo", modelID: model },
                { recent: true },
              )
            },
          })),
        ),
      ),
    )

    // Other providers (white-labeled as Apollo Luna 4.7)
    const otherOptions = pipe(
      sync.data.provider.filter((x) => x.id !== "apollo"),
      sortBy((p) => p.name),
      flatMap((provider) =>
        pipe(
          provider.models,
          entries(),
          filter(([_, info]) => info.status !== "deprecated"),
          map(([model, info]) => ({
            value: {
              providerID: provider.id,
              modelID: model,
            },
            title: "Luna 4.7",
            category: "Apollo",
            onSelect() {
              dialog.clear()
              local.model.set(
                { providerID: provider.id, modelID: model },
                { recent: true },
              )
            },
          })),
        ),
      ),
    )

    return [...apolloOptions, ...otherOptions]
  })

  return (
    <DialogSelect
      keybind={[
        {
          keybind: keybind.all.model_provider_list?.[0],
          title: "Connect provider",
          onTrigger() {
            dialog.replace(() => <DialogProvider />)
          },
        },
      ]}
      ref={setRef}
      skipFilter={true}
      title="Select model"
      current={local.model.current()}
      options={options()}
    />
  )
}
