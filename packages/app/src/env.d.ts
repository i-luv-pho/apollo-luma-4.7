interface ImportMetaEnv {
  readonly VITE_APOLLO_SERVER_HOST: string
  readonly VITE_APOLLO_SERVER_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
