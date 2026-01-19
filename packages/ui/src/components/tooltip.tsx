import { Tooltip as KobalteTooltip } from "@kobalte/core/tooltip"
import { children, createSignal, Match, onCleanup, onMount, splitProps, Switch, type JSX } from "solid-js"
import type { ComponentProps } from "solid-js"

export interface TooltipProps extends ComponentProps<typeof KobalteTooltip> {
  value: JSX.Element
  class?: string
  contentClass?: string
  contentStyle?: JSX.CSSProperties
  inactive?: boolean
}

export interface TooltipKeybindProps extends Omit<TooltipProps, "value"> {
  title: string
  keybind: string
}

export function TooltipKeybind(props: TooltipKeybindProps) {
  const [local, others] = splitProps(props, ["title", "keybind"])
  return (
    <Tooltip
      {...others}
      value={
        <div data-slot="tooltip-keybind">
          <span>{local.title}</span>
          <span data-slot="tooltip-keybind-key">{local.keybind}</span>
        </div>
      }
    />
  )
}

export function Tooltip(props: TooltipProps) {
  const [open, setOpen] = createSignal(false)
  const [local, others] = splitProps(props, ["children", "class", "contentClass", "contentStyle", "inactive"])

  const c = children(() => local.children)

  onMount(() => {
    const handleFocus = () => setOpen(true)
    const handleBlur = () => setOpen(false)
    const elements: HTMLElement[] = []

    const childElements = c()
    if (childElements instanceof HTMLElement) {
      childElements.addEventListener("focus", handleFocus)
      childElements.addEventListener("blur", handleBlur)
      elements.push(childElements)
    } else if (Array.isArray(childElements)) {
      for (const child of childElements) {
        if (child instanceof HTMLElement) {
          child.addEventListener("focus", handleFocus)
          child.addEventListener("blur", handleBlur)
          elements.push(child)
        }
      }
    }

    onCleanup(() => {
      for (const el of elements) {
        el.removeEventListener("focus", handleFocus)
        el.removeEventListener("blur", handleBlur)
      }
    })
  })

  return (
    <Switch>
      <Match when={local.inactive}>{local.children}</Match>
      <Match when={true}>
        <KobalteTooltip forceMount gutter={4} {...others} open={open()} onOpenChange={setOpen}>
          <KobalteTooltip.Trigger as={"div"} data-component="tooltip-trigger" class={local.class}>
            {c()}
          </KobalteTooltip.Trigger>
          <KobalteTooltip.Portal>
            <KobalteTooltip.Content
              data-component="tooltip"
              data-placement={props.placement}
              class={local.contentClass}
              style={local.contentStyle}
            >
              {others.value}
              {/* <KobalteTooltip.Arrow data-slot="tooltip-arrow" /> */}
            </KobalteTooltip.Content>
          </KobalteTooltip.Portal>
        </KobalteTooltip>
      </Match>
    </Switch>
  )
}
