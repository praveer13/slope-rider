/** Minimal vite env typing for BASE_URL (kit has no vite dependency). */
interface ImportMetaEnv {
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
