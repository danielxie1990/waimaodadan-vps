import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

/**
 * GET /api/translate/status
 *
 * 返回所有语言的翻译状态概览
 * 每种语言下列出 Pages / Products / Posts 的总数、已完成数、待处理列表
 */
export async function GET() {
  requireAuth();

  // 读取已启用的语言
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: ["enabled_languages", "target_languages"] } },
  });
  const map = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

  let targetCodes: string[] = [];
  try {
    targetCodes = JSON.parse(map.enabled_languages || map.target_languages || "[]");
  } catch {}

  const languages: Record<string, any> = {};

  for (const locale of targetCodes) {
    if (locale === "en") continue;

    // ── Pages ──
    const totalPages = await prisma.page.count({ where: { locale: "en" } });

    // Translated page IDs
    const translatedPageIds = (await prisma.page.findMany({
      where: { locale },
      select: { translationGroupId: true },
    }))
      .map(p => {
        const match = p.translationGroupId?.match(/page-(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((id): id is number => id !== null);

    const translatedPages = translatedPageIds.length;
    const pendingPages = totalPages - translatedPages;

    // English pages not yet translated → pending
    const pendingPageList = pendingPages > 0
      ? await prisma.page.findMany({
          where: { locale: "en", id: { notIn: translatedPageIds } },
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" },
        })
      : [];

    // Translated pages → completed
    const completedPageList = translatedPages > 0
      ? await prisma.page.findMany({
          where: { locale },
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" },
        })
      : [];

    // ── Products ──
    const totalProducts = await prisma.product.count({ where: { locale: "en" } });

    const translatedProductIds = (await prisma.product.findMany({
      where: { locale },
      select: { translationGroupId: true },
    }))
      .map(p => {
        const match = p.translationGroupId?.match(/product-(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((id): id is number => id !== null);

    const translatedProducts = translatedProductIds.length;
    const pendingProducts = totalProducts - translatedProducts;

    const pendingProductList = pendingProducts > 0
      ? await prisma.product.findMany({
          where: { locale: "en", id: { notIn: translatedProductIds } },
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" },
        })
      : [];

    const completedProductList = translatedProducts > 0
      ? await prisma.product.findMany({
          where: { locale },
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" },
        })
      : [];

    // ── Posts ──
    const totalPosts = await prisma.post.count({ where: { locale: "en" } });

    const translatedPostIds = (await prisma.post.findMany({
      where: { locale },
      select: { translationGroupId: true },
    }))
      .map(p => {
        const match = p.translationGroupId?.match(/post-(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((id): id is number => id !== null);

    const translatedPosts = translatedPostIds.length;
    const pendingPosts = totalPosts - translatedPosts;

    const pendingPostList = pendingPosts > 0
      ? await prisma.post.findMany({
          where: { locale: "en", id: { notIn: translatedPostIds } },
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" },
        })
      : [];

    const completedPostList = translatedPosts > 0
      ? await prisma.post.findMany({
          where: { locale },
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" },
        })
      : [];

    // ── Categories ──
    const totalCategories = await prisma.category.count({ where: { locale: "en" } });

    const translatedCatIds = (await prisma.category.findMany({
      where: { locale },
      select: { translationGroupId: true },
    }))
      .map(c => {
        const match = c.translationGroupId?.match(/cat-(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((id): id is number => id !== null);

    const translatedCategories = translatedCatIds.length;
    const pendingCategories = totalCategories - translatedCategories;

    const pendingCatList = pendingCategories > 0
      ? await prisma.category.findMany({
          where: { locale: "en", id: { notIn: translatedCatIds } },
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
        })
      : [];

    const completedCatList = translatedCategories > 0
      ? await prisma.category.findMany({
          where: { locale },
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
        })
      : [];

    languages[locale] = {
      pages: { total: totalPages, translated: translatedPages, pending: pendingPages, pendingList: pendingPageList, completedList: completedPageList },
      products: { total: totalProducts, translated: translatedProducts, pending: pendingProducts, pendingList: pendingProductList, completedList: completedProductList },
      posts: { total: totalPosts, translated: translatedPosts, pending: pendingPosts, pendingList: pendingPostList, completedList: completedPostList },
      categories: { total: totalCategories, translated: translatedCategories, pending: pendingCategories, pendingList: pendingCatList, completedList: completedCatList },
    };
  }

  return Response.json({ languages });
}
