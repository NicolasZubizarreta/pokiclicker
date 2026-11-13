/// <reference types="vite-plugin-pwa/react" />

/** Nom du cache des images lourdes, dérivé de leur contenu (vite.config.ts). */
declare const __CACHE_IMAGES__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
