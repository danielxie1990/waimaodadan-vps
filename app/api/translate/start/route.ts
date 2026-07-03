import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { getTranslationConfig, translateObject } from "@/lib/translation";
import { createJob, updateJob, addLog, getJob } from "@/lib/translation-jobs";
import { LOCALE_NAMES } from "@/lib/locale";

const TYPE_ICONS: Record<string, string> = {
  page: "📄",
  product: "📦",
  post: "✏️",
};

/**
 * 从翻译后的标题生成 URL slug
 */
function generateSlug(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * 确保 slug 唯一，冲突时追加 -1, -2, ...
 */
async function makeUniqueSlug(baseSlug: string, type: "page" | "product" | "post" | "category"): Promise<string> {
  if (!baseSlug) return baseSlug;
  const modelMap: Record<string, any> = { page: prisma.page, product: prisma.product, post: prisma.post, category: prisma.category };
  const model = modelMap[type];
  const existing = await (model as any).findUnique({ where: { slug: baseSlug } });
  if (!existing) return baseSlug;

  let counter = 1;
  while (true) {
    const candidate = `${baseSlug}-${counter}`;
    const found = await (model as any).findUnique({ where: { slug: candidate } });
    if (!found) return candidate;
    counter++;
  }
}

/**
 * POST /api/translate/start
 *
 * 启动后台翻译任务
 * Body: { locale: "zh" }
 *
 * 立即返回 jobId，翻译在后台执行
 */
export async function POST(req: NextRequest) {
  requireAuth();

  const config = await getTranslationConfig();
  if (!config) {
    return Response.json({ error: "❌ Translation API not configured." });
  }

  const body = await req.json().catch(() => ({}));
  const locale = body.locale;
  const types = body.types || { pages: true, categories: true, products: true, posts: true };
  if (!locale) {
    return Response.json({ error: "Missing locale" });
  }

  // 校验该语言是否已启用
  const langSettings = await prisma.siteSetting.findMany({
    where: { key: { in: ["enabled_languages", "target_languages"] } },
  });
  const langMap = Object.fromEntries(langSettings.map((s: any) => [s.key, s.value]));
  let enabledCodes: string[] = [];
  try { enabledCodes = JSON.parse(langMap.enabled_languages || langMap.target_languages || "[]"); } catch {}
  if (!enabledCodes.includes(locale)) {
    return Response.json({ error: `Language "${locale}" is not enabled. Enable it in Settings → Languages first.` });
  }

  const localeName = LOCALE_NAMES[locale]?.name || locale;
  const flag = LOCALE_NAMES[locale]?.flag || "🌐";

  // 计算总项目数（按 types 筛选）
  const counts = await Promise.all([
    types.pages ? prisma.page.count({ where: { locale: "en" } }) : 0,
    types.categories ? prisma.category.count({ where: { locale: "en" } }) : 0,
    types.products ? prisma.product.count({ where: { locale: "en" } }) : 0,
    types.posts ? prisma.post.count({ where: { locale: "en" } }) : 0,
  ]);
  const totalItems = counts.reduce((a: number, b: number) => a + b, 0);

  if (totalItems === 0) {
    return Response.json({ error: "No English content found to translate." });
  }

  const job = createJob(locale, `${flag} ${localeName}`, totalItems);
  updateJob(job.id, { status: "running" });

  // ── 后台执行 ──
  runTranslation(job.id, locale, config, localeName, types).catch(err => {
    addLog(job.id, `❌ Fatal error: ${err.message}`);
    updateJob(job.id, { status: "failed" });
  });

  return Response.json({ jobId: job.id });
}

async function runTranslation(jobId: string, locale: string, config: any, localeName: string, types: Record<string, boolean>) {
  try {
    // ── Pages ──
    if (types.pages) {
      addLog(jobId, `📄 Translating pages...`);
    }
    const pages = types.pages ? await prisma.page.findMany({ where: { locale: "en" }, orderBy: { title: "asc" } }) : [];
    for (const page of pages) {
      const existing = await prisma.page.findFirst({
        where: { translationGroupId: page.translationGroupId || `page-${page.id}`, locale },
      });
      if (existing) {
        updateJob(jobId, { skippedItems: (getJob(jobId)?.skippedItems || 0) + 1 });
        addLog(jobId, `⏭️ Skipped (already exists): ${page.title}`);
        updateJob(jobId, { completedItems: (getJob(jobId)?.completedItems || 0) + 1 });
        continue;
      }

      updateJob(jobId, { currentItem: `${TYPE_ICONS.page} ${page.title}` });
      addLog(jobId, `🔄 Translating page: ${page.title}`);

      try {
        const t = await translateObject({
          title: page.title,
          content: page.content,
          metaTitle: page.metaTitle || "",
          metaDesc: page.metaDesc || "",
        }, "en", locale, config, ["id"]);

        // 翻译 slug（唯一性去重）
        const rawPageSlug = generateSlug(t.title) || `${locale}/${page.slug}`.replace(/\/\//g, "/");
        const slug = await makeUniqueSlug(rawPageSlug, "page");

        await prisma.page.create({
          data: {
            slug: slug,
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
        addLog(jobId, `✅ Page translated: ${t.title}`);
      } catch (e: any) {
        addLog(jobId, `❌ Page failed: ${page.title} — ${e.message}`);
        updateJob(jobId, { failedItems: (getJob(jobId)?.failedItems || 0) + 1 });
      }
      updateJob(jobId, { completedItems: (getJob(jobId)?.completedItems || 0) + 1 });
    }

    // ── Categories ──
    if (types.categories) {
      addLog(jobId, `🏷️ Translating categories...`);
    }
    const categories = types.categories ? await prisma.category.findMany({ where: { locale: "en" }, orderBy: { name: "asc" } }) : [];
    for (const cat of categories) {
      const existing = await prisma.category.findFirst({
        where: { translationGroupId: cat.translationGroupId || `cat-${cat.id}`, locale },
      });
      if (existing) {
        addLog(jobId, `⏭️ Skipped (already exists): ${cat.name}`);
        updateJob(jobId, { completedItems: (getJob(jobId)?.completedItems || 0) + 1 });
        continue;
      }

      updateJob(jobId, { currentItem: `🏷️ ${cat.name}` });
      addLog(jobId, `🔄 Translating category: ${cat.name}`);

      try {
        const t = await translateObject({
          name: cat.name,
          description: cat.description,
        }, "en", locale, config, ["id", "slug", "image", "sortOrder"]);

        const rawCatSlug = generateSlug(t.name) || `${locale}/${cat.slug}`;
        const catSlug = await makeUniqueSlug(rawCatSlug, "category");

        await prisma.category.create({
          data: {
            slug: catSlug,
            name: t.name,
            description: t.description || "",
            image: cat.image,
            sortOrder: cat.sortOrder,
            locale,
            translationGroupId: cat.translationGroupId || `cat-${cat.id}`,
          },
        });
        addLog(jobId, `✅ Category translated: ${t.name}`);
      } catch (e: any) {
        addLog(jobId, `❌ Category failed: ${cat.name} — ${e.message}`);
        updateJob(jobId, { failedItems: (getJob(jobId)?.failedItems || 0) + 1 });
      }
      updateJob(jobId, { completedItems: (getJob(jobId)?.completedItems || 0) + 1 });
    }

    // ── Products ──
    if (types.products) {
      addLog(jobId, `📦 Translating products...`);
    }
    const products = types.products ? await prisma.product.findMany({
      where: { locale: "en" },
      include: { categories: true },
      orderBy: { title: "asc" },
    }) : [];
    for (const product of products) {
      const existing = await prisma.product.findFirst({
        where: { translationGroupId: product.translationGroupId || `product-${product.id}`, locale },
        include: { categories: true },
      });
      if (existing) {
        // Check if categories need to be supplemented
        const enCategories = product.categories || [];
        const existingCatSlugs = new Set((existing.categories || []).map((c: any) => c.slug));
        const missingCats = enCategories.filter((ec: any) => !existingCatSlugs.has(ec.slug));

        if (missingCats.length > 0) {
          addLog(jobId, `🔄 Supplementing categories for: ${product.title}`);
          for (const ec of missingCats) {
            let transName = ec.name;
            const enCat = await prisma.category.findFirst({ where: { slug: ec.slug, locale: "en" } });
            if (enCat?.translationGroupId) {
              const transCat = await prisma.category.findFirst({
                where: { translationGroupId: enCat.translationGroupId, locale },
                select: { name: true },
              });
              if (transCat?.name) transName = transCat.name;
            }
            await prisma.productCategory.create({
              data: { name: transName, slug: ec.slug, productId: existing.id },
            });
          }
          addLog(jobId, `  🏷️ Added ${missingCats.length} category/ies: ${missingCats.map((c: any) => c.name).join(", ")}`);
        }

        updateJob(jobId, { skippedItems: (getJob(jobId)?.skippedItems || 0) + 1 });
        addLog(jobId, missingCats.length > 0 ? `⏩ Skipped (cat supplemented): ${product.title}` : `⏭️ Skipped (already exists): ${product.title}`);
        updateJob(jobId, { completedItems: (getJob(jobId)?.completedItems || 0) + 1 });
        continue;
      }

      updateJob(jobId, { currentItem: `${TYPE_ICONS.product} ${product.title}` });
      addLog(jobId, `🔄 Translating product: ${product.title}`);

      try {
        const t = await translateObject({
          title: product.title,
          description: product.description,
        }, "en", locale, config, ["id", "slug"]);

        const rawProdSlug = generateSlug(t.title) || `${locale}/${product.slug}`;
        const slug = await makeUniqueSlug(rawProdSlug, "product");

        const created = await prisma.product.create({
          data: {
            slug,
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

        // ── Translate & attach categories ──
        // slug 保留英文（用于 URL 匹配），name 用翻译后的（用于显示）
        const enCategories = product.categories || [];
        for (const ec of enCategories) {
          let transName = ec.name;
          const enCat = await prisma.category.findFirst({ where: { slug: ec.slug, locale: "en" } });
          if (enCat?.translationGroupId) {
            const transCat = await prisma.category.findFirst({
              where: { translationGroupId: enCat.translationGroupId, locale },
              select: { name: true },
            });
            if (transCat?.name) transName = transCat.name;
          }
          await prisma.productCategory.create({
            data: {
              name: transName,
              slug: ec.slug, // 英文 slug，用于前端 URL 匹配
              productId: created.id,
            },
          });
        }
        if (enCategories.length > 0) {
          addLog(jobId, `  🏷️ Categories: ${enCategories.map((c: any) => c.name).join(", ")}`);
        }

        addLog(jobId, `✅ Product translated: ${t.title}`);
      } catch (e: any) {
        addLog(jobId, `❌ Product failed: ${product.title} — ${e.message}`);
        updateJob(jobId, { failedItems: (getJob(jobId)?.failedItems || 0) + 1 });
      }
      updateJob(jobId, { completedItems: (getJob(jobId)?.completedItems || 0) + 1 });
    }

    // ── Posts ──
    if (types.posts) {
      addLog(jobId, `✏️ Translating posts...`);
    }
    const posts = types.posts ? await prisma.post.findMany({ where: { locale: "en" }, orderBy: { title: "asc" } }) : [];
    for (const post of posts) {
      const existing = await prisma.post.findFirst({
        where: { translationGroupId: post.translationGroupId || `post-${post.id}`, locale },
      });
      if (existing) {
        updateJob(jobId, { skippedItems: (getJob(jobId)?.skippedItems || 0) + 1 });
        addLog(jobId, `⏭️ Skipped (already exists): ${post.title}`);
        updateJob(jobId, { completedItems: (getJob(jobId)?.completedItems || 0) + 1 });
        continue;
      }

      updateJob(jobId, { currentItem: `${TYPE_ICONS.post} ${post.title}` });
      addLog(jobId, `🔄 Translating post: ${post.title}`);

      try {
        const t = await translateObject({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          metaTitle: post.metaTitle || "",
          metaDesc: post.metaDesc || "",
        }, "en", locale, config, ["id", "slug"]);

        const rawPostSlug = generateSlug(t.title) || `${locale}/${post.slug}`;
        const slug = await makeUniqueSlug(rawPostSlug, "post");

        await prisma.post.create({
          data: {
            slug,
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
        addLog(jobId, `✅ Post translated: ${t.title}`);
      } catch (e: any) {
        addLog(jobId, `❌ Post failed: ${post.title} — ${e.message}`);
        updateJob(jobId, { failedItems: (getJob(jobId)?.failedItems || 0) + 1 });
      }
      updateJob(jobId, { completedItems: (getJob(jobId)?.completedItems || 0) + 1 });
    }

    updateJob(jobId, {
      status: "completed",
      currentItem: "",
      completedAt: new Date().toISOString(),
    });
    addLog(jobId, `🎉 ${localeName} translation complete!`);
  } catch (err: any) {
    addLog(jobId, `💥 Unexpected error: ${err.message}`);
    updateJob(jobId, { status: "failed" });
  }
}
