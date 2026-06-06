/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin in production, e.g. https://your-api.up.railway.app.
   *  Leave unset in dev to use the Vite proxy. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
