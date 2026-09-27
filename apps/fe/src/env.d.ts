/// <reference types="@solidjs/start/env" />

declare namespace App {
  interface RequestEventLocals {
    lang?: string;
  }
}

interface ImportMetaEnv {
  readonly VITE_APP_BASE_URL?: string;
  readonly VITE_APP_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
