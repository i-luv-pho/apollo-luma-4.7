export * from "./client.js"
export * from "./server.js"

import { createApolloClient } from "./client.js"
import { createApolloServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createApollo(options?: ServerOptions) {
  const server = await createApolloServer({
    ...options,
  })

  const client = createApolloClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
