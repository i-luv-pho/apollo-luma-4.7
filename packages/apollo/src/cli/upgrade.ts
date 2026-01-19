import { Bus } from "@/bus"
import { Config } from "@/config/config"
import { Flag } from "@/flag/flag"
import { Installation } from "@/installation"
import { Log } from "@/util/log"

const log = Log.create({ service: "upgrade" })

export async function upgrade() {
  const config = await Config.global()
  const method = await Installation.method()
  const latest = await Installation.latest(method).catch((err) => {
    log.warn("version check failed", { error: err.message, method })
    return undefined
  })
  if (!latest) return
  if (Installation.VERSION === latest) return

  if (config.autoupdate === false || Flag.APOLLO_DISABLE_AUTOUPDATE) {
    return
  }
  if (config.autoupdate === "notify") {
    await Bus.publish(Installation.Event.UpdateAvailable, { version: latest })
    return
  }

  if (method === "unknown") return
  await Installation.upgrade(method, latest)
    .then(() => Bus.publish(Installation.Event.Updated, { version: latest }))
    .catch(() => {})
}
