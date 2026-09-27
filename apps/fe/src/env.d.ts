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

declare const __APP_VERSION__: string;
declare const __APP_NAME__: string;
declare const __GIT_HASH__: string;
