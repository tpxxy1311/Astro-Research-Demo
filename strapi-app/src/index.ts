import type { Core } from '@strapi/strapi';

/**
 * Lese-Rechte, die die Public Role bekommen soll. Das Frontend ist rein statisch
 * und kennt keinen Login — der gesamte Content ist oeffentlich.
 */
const PUBLIC_PERMISSIONS: Record<string, string[]> = {
  'api::article.article': ['find', 'findOne'],
  'api::category.category': ['find', 'findOne'],
  'api::tag.tag': ['find', 'findOne'],
  'api::author.author': ['find'],
};

async function grantPublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn('[bootstrap] Public Role nicht gefunden — Permissions uebersprungen.');
    return;
  }

  const granted: string[] = [];

  for (const [uid, actions] of Object.entries(PUBLIC_PERMISSIONS)) {
    for (const action of actions) {
      const permissionAction = `${uid}.${action}`;
      const existing = await strapi.query('plugin::users-permissions.permission').findOne({
        where: { action: permissionAction, role: publicRole.id },
      });

      if (existing) continue;

      await strapi.query('plugin::users-permissions.permission').create({
        data: { action: permissionAction, role: publicRole.id },
      });
      granted.push(permissionAction);
    }
  }

  if (granted.length > 0) {
    strapi.log.info(`[bootstrap] Public-Lesezugriff erteilt: ${granted.join(', ')}`);
  }
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicPermissions(strapi);
  },
};
