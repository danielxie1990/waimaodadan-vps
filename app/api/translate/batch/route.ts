import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { getTranslationConfig, translateObject } from "@/lib/translation";

/**
 * POST /api/translate/batch
 *
 * 翻译指定语言的所有内容
 *
 * Body:
 *   { locale: "zh" }     → 只翻译成 zh
 *   { locale: "all" }    → 翻译所有已启用语言（默认行为）
 */
export async function POST(req: NextRequest) {
  requireAuth();

  const config = await getTranslationConfig();
  if (!config) {
    return Response.json({ error: "❌ Translation API not configured." });
  }

  const body = await req.json().catch(() => ({}));
  const localeParam = body.locale || "all";

  // 获取目标语言列表
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: ["target_languages", "enabled_languages"] } },
  });
  const map = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

  let targetCodes: string[] = [];
  try { targetCodes = JSON.parse(map.enabled_languages || map.target_languages || "[]"); } catch {}

  const results: Record<string, any> = {};
  let anyTranslated = false;

  for (const locale of targetCodes) {
    if (locale === "en") continue;
    if (localeParam !== "all" && locale !== localeParam) continue;

    const translated: { type: string; title: string; id: number }[] = [];
    const skipped: { type: string; title: string; id: number }[] = [];
    const errors: { type: string; title: string; error: string }[] = [];

    // ── Pages ──
    const pages = await prisma.page.findMany({ where: { locale: "en" } });
    for (const page of pages) {
      const existing = await prisma.page.findFirst({
        where: { translationGroupId: page.translationGroupId || `page-${page.id}`, locale },
      });
      if (existing) { skipped.push({ type: "page", title: page.title, id: page.id }); continue; }

      try {
        const t = await translateObject({
          title: page.title,
          content: page.content,
          metaTitle: page.metaTitle || "",
          metaDesc: page.metaDesc || "",
        }, "en", locale, config, ["id"]);

        const slug = page.slug === "/" ? locale : `${locale}/${page.slug}`.replace(/\/\//g, "/");

        await prisma.page.create({
          data: {
            slug: slug.replace(/^\//, ""),
            title: t.title,
            content: t.content,
            metaTitle: t.metaTitle || null,
            metaDesc: t.metaDesc || null,
            locale,
            translationGroupId: page.translationGroupId || `page-${page.id}`,
            templateSlug: page.templateSlug,
            published: page.published,
          },
        });
        translated.push({ type: "page", title: page.title, id: page.id });
        anyTranslated = true;
      } catch (e: any) {
        errors.push({ type: "page", title: page.title, error: e.message });
      }
    }

    // ── Products ──
    const products = await prisma.product.findMany({ where: { locale: "en" } });
    for (const product of products) {
      const existing = await prisma.product.findFirst({
        where: { translationGroupId: product.translationGroupId || `product-${product.id}`, locale },
      });
      if (existing) { skipped.push({ type: "product", title: product.title, id: product.id }); continue; }

      try {
        const t = await translateObject({
          title: product.title,
          description: product.description,
        }, "en", locale, config, ["id", "slug"]);

        await prisma.product.create({
          data: {
            slug: `${locale}/${product.slug}`,
            title: t.title,
            description: t.description,
            image: product.image,
            shape: product.shape,
            diameter: product.diameter,
            height: product.height,
            width: product.width,
            length: product.length,
            depth: product.depth,
            volume: product.volume,
            weight: product.weight,
            tinplate: product.tinplate,
            sku: product.sku,
            application: product.application,
            keywords: product.keywords,
            locale,
            translationGroupId: product.translationGroupId || `product-${product.id}`,
            published: product.published,
          },
        });
        translated.push({ type: "product", title: product.title, id: product.id });
        anyTranslated = true;
      } catch (e: any) {
        errors.push({ type: "product", title: product.title, error: e.message });
      }
    }

    // ── Posts ──
    const posts = await prisma.post.findMany({ where: { locale: "en" } });
    for (const post of posts) {
      const existing = await prisma.post.findFirst({
        where: { translationGroupId: post.translationGroupId || `post-${post.id}`, locale },
      });
      if (existing) { skipped.push({ type: "post", title: post.title, id: post.id }); continue; }

      try {
        const t = await translateObject({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          metaTitle: post.metaTitle || "",
          metaDesc: post.metaDesc || "",
        }, "en", locale, config, ["id", "slug"]);

        await prisma.post.create({
          data: {
            slug: `${locale}/${post.slug}`,
            title: t.title,
            content: t.content,
            excerpt: t.excerpt,
            metaTitle: t.metaTitle || null,
            metaDesc: t.metaDesc || null,
            image: post.image,
            locale,
            translationGroupId: post.translationGroupId || `post-${post.id}`,
            published: post.published,
          },
        });
        translated.push({ type: "post", title: post.title, id: post.id });
        anyTranslated = true;
      } catch (e: any) {
        errors.push({ type: "post", title: post.title, error: e.message });
      }
    }

    results[locale] = { translated, skipped, errors };
  }

  return Response.json({ success: anyTranslated, results });
}
