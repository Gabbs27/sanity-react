/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SANITY_PROJECT_ID: string;
  readonly VITE_SANITY_DATASET: string;
  readonly VITE_SANITY_API_VERSION: string;
  readonly VITE_GITHUB_TOKEN: string;
  readonly VITE_GITHUB_USERNAME: string;
  readonly VITE_GA_TRACKING_ID: string;
  readonly VITE_ANALYTICS_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
