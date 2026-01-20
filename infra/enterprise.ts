import { domain } from "./stage"

/**
 * Enterprise Infrastructure
 *
 * This module handles enterprise-specific deployment configuration for Apollo.
 * Includes features like:
 * - Self-hosted deployment options
 * - SSO/SAML authentication
 * - Custom domain support
 * - Enhanced security and compliance features
 *
 * Currently a placeholder for future implementation.
 */

// Enterprise secrets (configure when implementing)
// export const ENTERPRISE_LICENSE_KEY = new sst.Secret("ENTERPRISE_LICENSE_KEY")
// export const SAML_ISSUER = new sst.Secret("SAML_ISSUER")
// export const SAML_CERTIFICATE = new sst.Secret("SAML_CERTIFICATE")

// Placeholder: Uncomment and configure for enterprise deployments
//
// new sst.cloudflare.Worker("EnterpriseApi", {
//   domain: "enterprise." + domain,
//   handler: "packages/function/src/enterprise.ts",
//   environment: {
//     WEB_DOMAIN: domain,
//   },
//   url: true,
// })

export const enterpriseEnabled = false
