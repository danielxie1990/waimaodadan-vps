import { prisma } from "./prisma";
import { resolveDbSlug, cleanSlug, DEFAULT_LOCALE, normalizeLocale } from "./locale";

async function safeDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// ─── Public Page Content ─────────────────────

export async function getPageBySlug(slug: string, locale?: string) {
  const loc = normalizeLocale(locale);
  const dbSlug = resolveDbSlug(slug, loc);

  const page = await safeDb(
    () => prisma.page.findFirst({
      where: { slug: dbSlug, published: true, locale: loc },
    }),
    null
  );

  if (!page && loc !== "en") {
    return safeDb(
      () => prisma.page.findFirst({
        where: { slug, published: true, locale: "en" },
      }),
      null
    );
  }

  return page;
}

export async function getAllPublishedPages(locale?: string) {
  const loc = normalizeLocale(locale);
  const pages = await safeDb(
    () => prisma.page.findMany({
      where: { published: true, locale: loc },
      orderBy: { slug: "asc" },
    }),
    []
  );

  if (pages.length === 0 && loc !== "en") {
    return safeDb(
      () => prisma.page.findMany({
        where: { published: true, locale: "en" },
        orderBy: { slug: "asc" },
      }),
      []
    );
  }

  return pages;
}

// ─── Public Products ─────────────────────────

export async function getPublishedProducts(locale?: string) {
  const loc = normalizeLocale(locale);
  const products = await safeDb(
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
    []
  );

  if (products.length === 0 && loc !== "en") {
    return safeDb(
      () => prisma.product.findMany({
        where: { published: true, locale: "en" },
        orderBy: { createdAt: "desc" },
        include: {
          categories: true,
          images: { orderBy: { sortOrder: "asc" } },
          specs: { orderBy: { sortOrder: "asc" } },
        tabs: { orderBy: { sortOrder: "asc" } },
        },
      }),
      []
    );
  }

  return products;
}

export async function getProductBySlug(slug: string, locale?: string) {
  const loc = normalizeLocale(locale);
  const dbSlug = resolveDbSlug(slug, loc);

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
    null
  );

  if (!product && loc !== "en") {
    return safeDb(
      () => prisma.product.findFirst({
        where: { slug, published: true, locale: "en" },
        include: {
          categories: true,
          images: { orderBy: { sortOrder: "asc" } },
          specs: { orderBy: { sortOrder: "asc" } },
        tabs: { orderBy: { sortOrder: "asc" } },
        },
      }),
      null
    );
  }

  return product;
}

export async function getAllProductSlugs(locale?: string) {
  const loc = normalizeLocale(locale);
  const products = await safeDb(async () => {
    return await prisma.product.findMany({
      where: { published: true, locale: loc },
      select: { slug: true },
    });
  }, []);

  if (products.length === 0 && loc !== "en") {
    const enProducts = await safeDb(async () => {
      return await prisma.product.findMany({
        where: { published: true, locale: "en" },
        select: { slug: true },
      });
    }, []);
    return enProducts.map((p: any) => cleanSlug(p.slug));
  }

  return products.map((p: any) => cleanSlug(p.slug));
}

// ─── Public Posts ────────────────────────────

export async function getPublishedPosts(locale?: string) {
  const loc = normalizeLocale(locale);
  const posts = await safeDb(
    () => prisma.post.findMany({
      where: { published: true, locale: loc },
      orderBy: { createdAt: "desc" },
    }),
    []
  );

  if (posts.length === 0 && loc !== "en") {
    return safeDb(
      () => prisma.post.findMany({
        where: { published: true, locale: "en" },
        orderBy: { createdAt: "desc" },
      }),
      []
    );
  }

  return posts;
}

export async function getPostBySlug(slug: string, locale?: string) {
  const loc = normalizeLocale(locale);
  const dbSlug = resolveDbSlug(slug, loc);

  const post = await safeDb(
    () => prisma.post.findFirst({
      where: { slug: dbSlug, published: true },
    }),
    null
  );

  if (!post && loc !== "en") {
    return safeDb(
      () => prisma.post.findFirst({
        where: { slug, published: true, locale: "en" },
      }),
      null
    );
  }

  return post;
}

export async function getAllPostSlugs(locale?: string) {
  const loc = normalizeLocale(locale);
  const posts = await safeDb(async () => {
    return await prisma.post.findMany({
      where: { published: true, locale: loc },
      select: { slug: true },
    });
  }, []);

  if (posts.length === 0 && loc !== "en") {
    const enPosts = await safeDb(async () => {
      return await prisma.post.findMany({
        where: { published: true, locale: "en" },
        select: { slug: true },
      });
    }, []);
    return enPosts.map((p: any) => cleanSlug(p.slug));
  }

  return posts.map((p: any) => cleanSlug(p.slug));
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
  return safeDb(async () => {
    const settings = await prisma.siteSetting.findMany();
    const map: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of settings) map[s.key] = s.value;
    return map;
  }, DEFAULT_SETTINGS);
}

// ─── Products by category (locale-aware) ─────

export async function getProductsByCategory(slug: string, locale?: string) {
  const loc = normalizeLocale(locale);
  const products = await safeDb(
    () => prisma.product.findMany({
      where: {
        published: true,
        locale: loc,
        categories: { some: { slug } },
      },
      include: {
        categories: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    []
  );

  if (products.length === 0 && loc !== "en") {
    return safeDb(
      () => prisma.product.findMany({
        where: {
          published: true,
          locale: "en",
          categories: { some: { slug } },
        },
        include: {
          categories: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      []
    );
  }

  return products;
}

// ─── Categories (locale-aware) ───────────────

export async function getAllCategories(locale?: string) {
  const loc = normalizeLocale(locale);
  const cats = await safeDb(
    () => prisma.category.findMany({
      where: { locale: loc },
      orderBy: { sortOrder: "asc" },
    }),
    []
  );
  if (cats.length === 0 && loc !== "en") {
    return safeDb(
      () => prisma.category.findMany({
        where: { locale: "en" },
        orderBy: { sortOrder: "asc" },
      }),
      []
    );
  }
  return cats;
}

export async function getCategoryBySlug(slug: string, locale?: string) {
  const loc = normalizeLocale(locale);
  // Try translated version first
  const cat = await safeDb(
    () => prisma.category.findFirst({
      where: { slug, locale: loc },
    }),
    null
  );
  if (cat) return cat;
  // Fallback to English
  if (loc !== "en") {
    return safeDb(
      () => prisma.category.findFirst({
        where: { slug, locale: "en" },
      }),
      null
    );
  }
  return cat;
}
