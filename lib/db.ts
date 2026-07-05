import { prisma } from "./prisma";
import { resolveDbSlug, cleanSlug, DEFAULT_LOCALE, normalizeLocale } from "./locale";
import { cacheGet, cacheSet } from "./cache";

// ─── Safe DB wrapper ────────────────────────────
// In development, let errors propagate so they're visible.
// In production, return a fallback to prevent 500 pages.

async function safeDb<T>(fn: () => Promise<T>, fallback: T, context = "db"): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[safeDb] Error in ${context}:`, err);
      throw err;
    }
    console.error(`[safeDb] Error in ${context} (returning fallback):`, err);
    return fallback;
  }
}

/**
 * Fetch data with locale fallback in a single pass.
 */
async function withLocaleFallback<T = any>(
  query: (locale: string) => Promise<T[]>,
  locale: string | undefined,
  cacheKey: string
): Promise<T[]> {
  const loc = normalizeLocale(locale);

  // Check cache first
  const cached = cacheGet<T[]>(`${cacheKey}:${loc}`);
  if (cached) return cached;

  const results = await query(loc);

  // If no results for non-English locale, try English
  if (results.length === 0 && loc !== DEFAULT_LOCALE) {
    const enResults = await query(DEFAULT_LOCALE);
    cacheSet(`${cacheKey}:${loc}`, enResults);
    return enResults;
  }

  cacheSet(`${cacheKey}:${loc}`, results);
  return results;
}

async function withLocaleFallbackSingle<T extends { locale?: string }>(
  query: (locale: string) => Promise<T | null>,
  locale: string | undefined,
  cacheKey: string
): Promise<T | null> {
  const loc = normalizeLocale(locale);

  const cached = cacheGet<T | null>(`${cacheKey}:${loc}`);
  if (cached !== null && cached !== undefined) return cached;

  let result = await query(loc);

  if (!result && loc !== DEFAULT_LOCALE) {
    result = await query(DEFAULT_LOCALE);
  }

  if (result) cacheSet(`${cacheKey}:${loc}`, result);
  return result;
}

// ─── Cache keys ─────────────────────────────────

const CACHE_KEYS = {
  SETTINGS: "settings",
  PRODUCTS: "products",
  PRODUCT: "product",
  PRODUCT_SLUGS: "product-slugs",
  POSTS: "posts",
  POST: "post",
  POST_SLUGS: "post-slugs",
  PAGES: "pages",
  PAGE: "page",
  CATEGORIES: "categories",
  CATEGORY: "category",
  PRODUCTS_BY_CATEGORY: "products-by-cat",
} as const;

// ─── Cache invalidation ─────────────────────────

export function invalidateCache(type: keyof typeof CACHE_KEYS, locale?: string): void {
  const { cacheDelete, cacheDeletePrefix } = require("./cache");
  const prefix = CACHE_KEYS[type];
  cacheDeletePrefix(`${prefix}:`);
  // Also invalidate other locale variants
  if (locale) {
    cacheDelete(`${prefix}:${locale}`);
  }
}

// ─── Public Page Content ─────────────────────

export async function getPageBySlug(slug: string, locale?: string) {
  const loc = normalizeLocale(locale);
  const dbSlug = resolveDbSlug(slug, loc);
  const cacheKey = `page:${dbSlug}:${loc}`;

  const cached = cacheGet<any>(cacheKey);
  if (cached !== null && cached !== undefined) return cached;

  const page = await safeDb(
    () => prisma.page.findFirst({
      where: { slug: dbSlug, published: true, locale: loc },
    }),
    null,
    `getPageBySlug(${slug})`
  );

  if (!page && loc !== DEFAULT_LOCALE) {
    const enPage = await safeDb(
      () => prisma.page.findFirst({
        where: { slug, published: true, locale: DEFAULT_LOCALE },
      }),
      null,
      `getPageBySlug-en(${slug})`
    );
    if (enPage) cacheSet(cacheKey, enPage);
    return enPage;
  }

  if (page) cacheSet(cacheKey, page);
  return page;
}

export async function getAllPublishedPages(locale?: string) {
  return withLocaleFallback(
    (loc) => safeDb(
      () => prisma.page.findMany({
        where: { published: true, locale: loc },
        orderBy: { slug: "asc" },
      }),
      [],
      `getAllPublishedPages(${loc})`
    ),
    locale,
    CACHE_KEYS.PAGES
  );
}

// ─── Public Products ─────────────────────────

export async function getPublishedProducts(locale?: string) {
  return withLocaleFallback(
    (loc) => safeDb(
      () => prisma.product.findMany({
        where: { published: true, locale: loc },
        orderBy: { createdAt: "desc" },
        include: {
          categories: true,
          images: { orderBy: { sortOrder: "asc" } },
          specs: { orderBy: { sortOrder: "asc" } },
          tabs: { orderBy: { sortOrder: "asc" } },
        },
      }),
      [],
      `getPublishedProducts(${loc})`
    ),
    locale,
    CACHE_KEYS.PRODUCTS
  );
}

export async function getProductBySlug(slug: string, locale?: string) {
  const loc = normalizeLocale(locale);
  const dbSlug = resolveDbSlug(slug, loc);
  const cacheKey = `product:${dbSlug}:${loc}`;

  const cached = cacheGet<any>(cacheKey);
  if (cached !== null && cached !== undefined) return cached;

  const product = await safeDb(
    () => prisma.product.findFirst({
      where: { slug: dbSlug, published: true },
      include: {
        categories: true,
        images: { orderBy: { sortOrder: "asc" } },
        specs: { orderBy: { sortOrder: "asc" } },
        tabs: { orderBy: { sortOrder: "asc" } },
      },
    }),
    null,
    `getProductBySlug(${slug})`
  );

  if (!product && loc !== DEFAULT_LOCALE) {
    const enProduct = await safeDb(
      () => prisma.product.findFirst({
        where: { slug, published: true, locale: DEFAULT_LOCALE },
        include: {
          categories: true,
          images: { orderBy: { sortOrder: "asc" } },
          specs: { orderBy: { sortOrder: "asc" } },
          tabs: { orderBy: { sortOrder: "asc" } },
        },
      }),
      null,
      `getProductBySlug-en(${slug})`
    );
    if (enProduct) cacheSet(cacheKey, enProduct);
    return enProduct;
  }

  if (product) cacheSet(cacheKey, product);
  return product;
}

export async function getAllProductSlugs(locale?: string) {
  const loc = normalizeLocale(locale);
  const cacheKey = `product-slugs:${loc}`;

  const cached = cacheGet<{ slug: string }[]>(cacheKey);
  if (cached) return cached.map((p) => cleanSlug(p.slug));

  const products = await safeDb(async () => {
    return await prisma.product.findMany({
      where: { published: true, locale: loc },
      select: { slug: true },
    });
  }, [], `getAllProductSlugs(${loc})`);

  if (products.length === 0 && loc !== DEFAULT_LOCALE) {
    const enProducts = await safeDb(async () => {
      return await prisma.product.findMany({
        where: { published: true, locale: DEFAULT_LOCALE },
        select: { slug: true },
      });
    }, [], `getAllProductSlugs-en(${loc})`);
    cacheSet(cacheKey, enProducts);
    return enProducts.map((p) => cleanSlug(p.slug));
  }

  cacheSet(cacheKey, products);
  return products.map((p) => cleanSlug(p.slug));
}

// ─── Public Posts ────────────────────────────

export async function getPublishedPosts(locale?: string) {
  return withLocaleFallback(
    (loc) => safeDb(
      () => prisma.post.findMany({
        where: { published: true, locale: loc },
        orderBy: { createdAt: "desc" },
      }),
      [],
      `getPublishedPosts(${loc})`
    ),
    locale,
    CACHE_KEYS.POSTS
  );
}

export async function getPostBySlug(slug: string, locale?: string) {
  return withLocaleFallbackSingle(
    (loc) => safeDb(
      () => prisma.post.findFirst({
        where: { slug: resolveDbSlug(slug, loc), published: true },
      }),
      null,
      `getPostBySlug(${slug})`
    ),
    locale,
    `post:${slug}`
  );
}

export async function getAllPostSlugs(locale?: string) {
  const loc = normalizeLocale(locale);
  const cacheKey = `post-slugs:${loc}`;

  const cached = cacheGet<{ slug: string }[]>(cacheKey);
  if (cached) return cached.map((p) => cleanSlug(p.slug));

  const posts = await safeDb(async () => {
    return await prisma.post.findMany({
      where: { published: true, locale: loc },
      select: { slug: true },
    });
  }, [], `getAllPostSlugs(${loc})`);

  if (posts.length === 0 && loc !== DEFAULT_LOCALE) {
    const enPosts = await safeDb(async () => {
      return await prisma.post.findMany({
        where: { published: true, locale: DEFAULT_LOCALE },
        select: { slug: true },
      });
    }, [], `getAllPostSlugs-en(${loc})`);
    cacheSet(cacheKey, enPosts);
    return enPosts.map((p) => cleanSlug(p.slug));
  }

  cacheSet(cacheKey, posts);
  return posts.map((p) => cleanSlug(p.slug));
}

// ─── Settings ────────────────────────────────

const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: "My Company",
  site_tagline: "Your trusted partner for quality products.",
  site_description: "Professional manufacturer with years of experience serving global clients.",
  contact_email: "contact@example.com",
  contact_phone: "+1 (555) 000-0000",
  address: "Your Address Here",
  product_label: "Products",
  product_slug: "products",
  category_slug: "categories",
  cta_text: "Contact Us",
  cta_url: "/contact",
  inquiry_button_text: "SEND INQUIRY",
  back_to_catalog_text: "Back to Catalog",
  admin_brand: "Admin Panel",
  footer_copyright: "© All rights reserved.",
  primary_color: "#065f46",
};

export async function getSiteSettings(): Promise<Record<string, string>> {
  const cached = cacheGet<Record<string, string>>(CACHE_KEYS.SETTINGS);
  if (cached) return cached;

  const settings = await safeDb(async () => {
    const rows = await prisma.siteSetting.findMany();
    const map: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of rows) map[s.key] = s.value;
    return map;
  }, DEFAULT_SETTINGS, "getSiteSettings");

  cacheSet(CACHE_KEYS.SETTINGS, settings);
  return settings;
}

// ─── Products by category (locale-aware) ─────

export async function getProductsByCategory(slug: string, locale?: string) {
  return withLocaleFallback(
    (loc) => safeDb(
      () => prisma.product.findMany({
        where: {
          published: true,
          locale: loc,
          categories: { some: { slug } },
        },
        include: { categories: true, images: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
      }),
      [],
      `getProductsByCategory(${slug})`
    ),
    locale,
    `${CACHE_KEYS.PRODUCTS_BY_CATEGORY}:${slug}`
  );
}

// ─── Categories (locale-aware) ───────────────

export async function getAllCategories(locale?: string) {
  return withLocaleFallback(
    (loc) => safeDb(
      () => prisma.category.findMany({
        where: { locale: loc },
        orderBy: { sortOrder: "asc" },
      }),
      [],
      `getAllCategories(${loc})`
    ),
    locale,
    CACHE_KEYS.CATEGORIES
  );
}

export async function getCategoryBySlug(slug: string, locale?: string) {
  const cacheKey = `${CACHE_KEYS.CATEGORY}:${slug}:${locale || DEFAULT_LOCALE}`;
  const cached = cacheGet<any>(cacheKey);
  if (cached !== null && cached !== undefined) return cached;

  const loc = normalizeLocale(locale);
  let cat = await safeDb(
    () => prisma.category.findFirst({ where: { slug, locale: loc } }),
    null,
    `getCategoryBySlug(${slug})`
  );

  if (!cat && loc !== DEFAULT_LOCALE) {
    cat = await safeDb(
      () => prisma.category.findFirst({ where: { slug, locale: DEFAULT_LOCALE } }),
      null,
      `getCategoryBySlug-en(${slug})`
    );
  }

  if (cat) cacheSet(cacheKey, cat);
  return cat;
}
