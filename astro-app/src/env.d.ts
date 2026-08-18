interface ImportMetaEnv {
  readonly STRAPI_URL?: string;
  readonly STRAPI_TOKEN?: string;
  readonly SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
