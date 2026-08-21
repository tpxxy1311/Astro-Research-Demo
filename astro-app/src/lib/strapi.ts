/**
 * Fetch-Helper fuer die Strapi-REST-API.
 *
 * Alle Aufrufe passieren zur Build-Zeit (volles SSG). Faellt Strapi aus,
 * soll der Build laut scheitern statt eine halbleere Seite zu erzeugen.
 */

import { SITE_LANG } from '../consts';

const STRAPI_URL = (import.meta.env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '');
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN;

/* ------------------------------------------------------------------ Typen */

export interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
}

export interface StrapiMedia {
  id: number;
  documentId: string;
  name: string;
  url: string;
  mime: string;
  size: number;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  formats: Record<string, StrapiMediaFormat> | null;
}

/** Inline-Knoten innerhalb eines Blocks. */
export type BlockTextNode = {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

export type BlockLinkNode = {
  type: 'link';
  url: string;
  children: BlockInlineNode[];
};

export type BlockInlineNode = BlockTextNode | BlockLinkNode;

/** Block-Knoten, wie sie das native Strapi-"Blocks"-Feld liefert. */
export type BlockNode =
  | { type: 'paragraph'; children: BlockInlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: BlockInlineNode[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: BlockListItemNode[] }
  | { type: 'quote'; children: BlockInlineNode[] }
  | { type: 'code'; language?: string; children: BlockTextNode[] }
  | { type: 'image'; image: StrapiMedia }
  | { type: string; children?: unknown[]; [key: string]: unknown };

export type BlockListItemNode = {
  type: 'list-item';
  children: (BlockInlineNode | BlockNode)[];
};

export type BlocksContent = BlockNode[];

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Tag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

export type PaperType = 'Bachelor Thesis' | 'Master Thesis' | 'Project Report' | 'Paper';

export interface Article {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  abstract: string;
  content: BlocksContent | null;
  coverImage: StrapiMedia | null;
  publishedDate: string;
  originalPaperTitle: string | null;
  originalPaperType: PaperType | null;
  originalPaperFile: StrapiMedia | null;
  readingTime: number | null;
  featured: boolean;
  category: Category | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
}

export interface Author {
  id: number;
  documentId: string;
  name: string;
  bio: BlocksContent | null;
  avatar: StrapiMedia | null;
  socialLinks: SocialLink[];
}

interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: { page: number; pageSize: number; pageCount: number; total: number };
  };
}

/* ------------------------------------------------------------- Basis-Fetch */

async function strapiFetch<T>(
  path: string,
  options: { allowMissing?: boolean } = {}
): Promise<StrapiResponse<T> | null> {
  const url = `${STRAPI_URL}/api${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (STRAPI_TOKEN) headers.Authorization = `Bearer ${STRAPI_TOKEN}`;

  let response: Response;
  try {
    response = await fetch(url, { headers });
  } catch (cause) {
    throw new Error(
      `Strapi ist unter ${STRAPI_URL} nicht erreichbar. Laeuft "npm run develop" im Ordner strapi-app?`,
      { cause }
    );
  }

  // Ein leerer Single Type antwortet mit 404 — das ist kein Fehler, sondern
  // heisst nur: im Admin wurde noch nichts angelegt.
  if (response.status === 404 && options.allowMissing) return null;

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strapi-Anfrage fehlgeschlagen (${response.status}) fuer ${url}: ${body}`);
  }

  return response.json() as Promise<StrapiResponse<T>>;
}

/**
 * Macht aus einem relativen Strapi-Upload-Pfad eine absolute URL.
 * Bei einem externen Provider (S3, Cloudinary) ist die URL bereits absolut.
 */
export function mediaUrl(media: StrapiMedia | null | undefined): string | null {
  if (!media?.url) return null;
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`;
}

/** Kleinere Variante eines Bildes, falls Strapi eine erzeugt hat. */
export function mediaUrlFormat(
  media: StrapiMedia | null | undefined,
  format: 'thumbnail' | 'small' | 'medium' | 'large'
): string | null {
  const variant = media?.formats?.[format];
  if (!variant) return mediaUrl(media);
  return variant.url.startsWith('http') ? variant.url : `${STRAPI_URL}${variant.url}`;
}

/* ----------------------------------------------------------------- Queries */

const ARTICLE_QUERY = 'populate=*&sort[0]=publishedDate:desc&pagination[pageSize]=100';

async function fetchList<T>(path: string): Promise<T[]> {
  const response = await strapiFetch<T[]>(path);
  return response?.data ?? [];
}

export async function getArticles(): Promise<Article[]> {
  return fetchList<Article>(`/articles?${ARTICLE_QUERY}`);
}

export async function getFeaturedArticles(): Promise<Article[]> {
  return fetchList<Article>(`/articles?${ARTICLE_QUERY}&filters[featured][$eq]=true`);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const data = await fetchList<Article>(
    `/articles?populate=*&filters[slug][$eq]=${encodeURIComponent(slug)}`
  );
  return data[0] ?? null;
}

export async function getArticlesByCategory(slug: string): Promise<Article[]> {
  return fetchList<Article>(
    `/articles?${ARTICLE_QUERY}&filters[category][slug][$eq]=${encodeURIComponent(slug)}`
  );
}

export async function getArticlesByTag(slug: string): Promise<Article[]> {
  return fetchList<Article>(
    `/articles?${ARTICLE_QUERY}&filters[tags][slug][$eq]=${encodeURIComponent(slug)}`
  );
}

export async function getCategories(): Promise<Category[]> {
  return fetchList<Category>('/categories?sort[0]=name:asc&pagination[pageSize]=100');
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const data = await fetchList<Category>(
    `/categories?filters[slug][$eq]=${encodeURIComponent(slug)}`
  );
  return data[0] ?? null;
}

export async function getTags(): Promise<Tag[]> {
  return fetchList<Tag>('/tags?sort[0]=name:asc&pagination[pageSize]=100');
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const data = await fetchList<Tag>(`/tags?filters[slug][$eq]=${encodeURIComponent(slug)}`);
  return data[0] ?? null;
}

/** Single Type — liefert null, solange im Admin noch nichts angelegt/publiziert ist. */
export async function getAuthor(): Promise<Author | null> {
  const response = await strapiFetch<Author | null>('/author?populate=*', { allowMissing: true });
  return response?.data ?? null;
}

/* ------------------------------------------------------------- Hilfsmittel */

export function formatDate(value: string): string {
  // Sprache aus consts.ts statt als Literal: derselbe Wert steht am lang des
  // <html>, damit koennen Auszeichnung und Datumsformat nicht auseinanderlaufen.
  return new Date(value).toLocaleDateString(SITE_LANG, {
    // Nicht '2-digit': im Deutschen gehoert die fuehrende Null dazu
    // ("05. Maerz"), im Englischen liest sich "March 05" falsch.
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Grobe Schaetzung, falls im CMS keine Lesezeit gepflegt wurde (~200 Woerter/Minute). */
export function estimateReadingTime(content: BlocksContent | null): number {
  if (!content) return 1;
  const collect = (nodes: unknown[]): string =>
    nodes
      .map((node) => {
        if (!node || typeof node !== 'object') return '';
        const record = node as Record<string, unknown>;
        if (record.type === 'text' && typeof record.text === 'string') return record.text;
        if (Array.isArray(record.children)) return collect(record.children);
        return '';
      })
      .join(' ');

  const words = collect(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
