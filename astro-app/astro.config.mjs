// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Absolute URL der spaeteren Live-Seite — noetig fuer Sitemap, RSS und
  // canonical/Open-Graph-Tags. Vor dem Deploy in .env auf die echte Domain setzen.
  site: process.env.SITE_URL ?? 'http://localhost:4321',

  // Volles SSG: alles wird zur Build-Zeit aus Strapi geholt.
  output: 'static',

  integrations: [sitemap()],
});
