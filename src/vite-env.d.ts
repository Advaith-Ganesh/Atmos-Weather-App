/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Visual Crossing Timeline API key. Inlined into the bundle at build time. */
  readonly VITE_VISUAL_CROSSING_API_KEY?: string;
  /** Optional override, e.g. to route requests through a proxy. */
  readonly VITE_VISUAL_CROSSING_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
