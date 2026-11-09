/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** "true" on the GitHub Pages prototype. Anything else = production behaviour. */
  readonly PUBLIC_PROTOTYPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
