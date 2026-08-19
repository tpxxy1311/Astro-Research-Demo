// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  // Absolute URL der spaeteren Live-Seite — noetig fuer Sitemap, RSS und
  // canonical/Open-Graph-Tags. Vor dem Deploy in .env auf die echte Domain setzen.
  site: process.env.SITE_URL ?? 'http://localhost:4321',

  // Volles SSG: alles wird zur Build-Zeit aus Strapi geholt.
  output: 'static',

  // DM Sans wird zur Build-Zeit von Google geladen und mit ausgeliefert —
  // zur Laufzeit geht kein Request an fonts.googleapis.com.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'DM Sans',
      cssVariable: '--font-dm-sans',
      // Nur die Schnitte, die wirklich benutzt werden. Ohne Angabe waere es nur 400.
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      // Letzter Eintrag ist generisch — daraus baut Astro einen
      // metrisch angeglichenen Fallback gegen Layout-Shift.
      fallbacks: ['sans-serif'],
    },
  ],

  // Icons werden zur Build-Zeit als SVG ins HTML eingesetzt — kein Sprite,
  // kein zusaetzlicher Request, kein Client-JS. `lucide:*` kommt aus
  // @iconify-json/lucide, praefixlose Namen aus src/icons/.
  integrations: [sitemap(), icon()],
});
