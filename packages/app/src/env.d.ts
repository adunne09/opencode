interface ImportMetaEnv {
  readonly VITE_OPENCODE_SERVER_HOST: string
  readonly VITE_OPENCODE_SERVER_PORT: string
  readonly VITE_OPENCODE_SERVER_PROTOCOL?: string
  readonly VITE_OPENCODE_SERVER_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
