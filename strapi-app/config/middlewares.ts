import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => {
  // In Produktion liegen Bilder und PDFs auf einer eigenen Domain (R2). Ohne
  // diese Ausnahmen blockiert Strapis eigene CSP die Vorschauen im Admin.
  const mediaHost = env('R2_PUBLIC_URL');
  const mediaSources = ["'self'", 'data:', 'blob:', ...(mediaHost ? [mediaHost] : [])];

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'img-src': mediaSources,
            'media-src': mediaSources,
          },
        },
      },
    },
    {
      name: 'strapi::cors',
      config: {
        // Die Seite wird statisch gebaut und fragt die API nur zur Build-Zeit
        // ab — der Browser braucht die API gar nicht. Die Liste bleibt deshalb
        // bewusst kurz.
        origin: [env('FRONTEND_URL'), 'http://localhost:4321'].filter(Boolean),
      },
    },
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};

export default config;
