import { Component, Show } from "solid-js"
import { useDialog } from "@apollo-ai/ui/context/dialog"
import { popularProviders, useProviders } from "@/hooks/use-providers"
import { Dialog } from "@apollo-ai/ui/dialog"
import { List } from "@apollo-ai/ui/list"
import { Tag } from "@apollo-ai/ui/tag"
import { ProviderIcon } from "@apollo-ai/ui/provider-icon"
import { IconName } from "@apollo-ai/ui/icons/provider"
import { DialogConnectProvider } from "./dialog-connect-provider"

export const DialogSelectProvider: Component = () => {
  const dialog = useDialog()
  const providers = useProviders()

  return (
    <Dialog title="Connect provider">
      <List
        search={{ placeholder: "Search providers", autofocus: true }}
        activeIcon="plus-small"
        key={(x) => x?.id}
        items={providers.all}
        filterKeys={["id", "name"]}
        groupBy={(x) => (popularProviders.includes(x.id) ? "Popular" : "Other")}
        sortBy={(a, b) => {
          if (popularProviders.includes(a.id) && popularProviders.includes(b.id))
            return popularProviders.indexOf(a.id) - popularProviders.indexOf(b.id)
          return a.name.localeCompare(b.name)
        }}
        sortGroupsBy={(a, b) => {
          if (a.category === "Popular" && b.category !== "Popular") return -1
          if (b.category === "Popular" && a.category !== "Popular") return 1
          return 0
        }}
        onSelect={(x) => {
          if (!x) return
          dialog.show(() => <DialogConnectProvider provider={x.id} />)
        }}
      >
        {(i) => (
          <div class="px-1.25 w-full flex items-center gap-x-3">
            <ProviderIcon data-slot="list-item-extra-icon" id={i.id as IconName} />
            <span>{i.name}</span>
            <Show when={i.id === "apollo"}>
              <Tag>Recommended</Tag>
            </Show>
            <Show when={i.id === "anthropic"}>
              <div class="text-14-regular text-text-weak">Connect with subscription or API key</div>
            </Show>
          </div>
        )}
      </List>
    </Dialog>
  )
}
