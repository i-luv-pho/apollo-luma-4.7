import { domain } from "./stage"

/**
 * Console Infrastructure
 *
 * This module handles the deployment configuration for the Apollo console/admin dashboard.
 * Currently a placeholder for future implementation.
 *
 * TODO: Implement console deployment when admin package is ready
 * - Deploy packages/admin as a StaticSite
 * - Configure authentication and access controls
 * - Link to API worker for admin operations
 */

// Placeholder: Uncomment and configure when admin dashboard is ready for deployment
//
// new sst.cloudflare.StaticSite("Console", {
//   domain: "console." + domain,
//   path: "packages/admin",
//   build: {
//     command: "bun turbo build",
//     output: "./dist",
//   },
// })

export const consoleEnabled = false
