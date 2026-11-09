/// <reference path="../.astro/types.d.ts" />

/** Build-time constant from astro.config.ts: true when content comes from the local fixtures. */
declare const __USE_FIXTURES__: boolean;

interface ImportMetaEnv {
  /** "true" on the GitHub Pages prototype. Anything else = production behaviour. */
  readonly PUBLIC_PROTOTYPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
