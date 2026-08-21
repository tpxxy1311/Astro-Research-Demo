import rss from '@astrojs/rss';
import { getArticles } from '../lib/strapi';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_LANG } from '../consts';

export async function GET(context) {
  const articles = await getArticles();

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: articles.map((article) => ({
      title: article.title,
      description: article.abstract,
      pubDate: new Date(article.publishedDate),
      link: `/articles/${article.slug}/`,
      categories: [
        ...(article.category ? [article.category.name] : []),
        ...(article.tags ?? []).map((tag) => tag.name),
      ],
    })),
    customData: `<language>${SITE_LANG}</language>`,
  });
}
