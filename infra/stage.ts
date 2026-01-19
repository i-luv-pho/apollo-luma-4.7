export const domain = (() => {
  if ($app.stage === "production") return "github.com/i-luv-pho/apollov2"
  if ($app.stage === "dev") return "dev.github.com/i-luv-pho/apollov2"
  return `${$app.stage}.dev.github.com/i-luv-pho/apollov2`
})()

// CloudFlare Zone ID should be provided via environment variable
export const zoneID = process.env.CLOUDFLARE_ZONE_ID || ""

new cloudflare.RegionalHostname("RegionalHostname", {
  hostname: domain,
  regionKey: "us",
  zoneId: zoneID,
})

export const shortDomain = (() => {
  if ($app.stage === "production") return "github.com/i-luv-pho/apollov2"
  if ($app.stage === "dev") return "dev.github.com/i-luv-pho/apollov2"
  return `${$app.stage}.dev.github.com/i-luv-pho/apollov2`
})()
