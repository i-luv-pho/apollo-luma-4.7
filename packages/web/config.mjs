const stage = process.env.SST_STAGE || "dev"

export default {
  url: stage === "production" ? "https://github.com/i-luv-pho/apollov2" : `https://${stage}.github.com/i-luv-pho/apollov2`,
  console: stage === "production" ? "https://github.com/i-luv-pho/apollov2/auth" : `https://${stage}.github.com/i-luv-pho/apollov2/auth`,
  email: "contact@github.com/i-luv-pho",
  socialCard: "https://social-cards.sst.dev",
  github: "https://github.com/i-luv-pho/apollov2",
  discord: "https://github.com/i-luv-pho/apollov2/discord",
  headerLinks: [
    { name: "Home", url: "/" },
    { name: "Docs", url: "/docs/" },
  ],
}
