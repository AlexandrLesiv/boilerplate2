/// <reference types="@solidjs/start/env" />

declare namespace App {
  interface RequestEventLocals {
    lang?: string;
  }
}

interface ImportMetaEnv {
  readonly VITE_APP_BASE_URL: string;
  readonly VITE_APP_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Build-time client configuration, baked in by `vite-plugins/define-client-configuration.ts`. */
declare const __CLIENT_CONFIG_DEFAULTS__: import('@repo/shared').ClientConfig;

declare const __APP_VERSION__: string;
declare const __APP_NAME__: string;
declare const __GIT_HASH__: string;
