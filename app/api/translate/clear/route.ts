import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

/**
 * POST /api/translate/clear
 *
 * 清空所有非英文的翻译内容
 * Body: { locale?: "zh" | "all" }
 *
 * locale="all"（默认）→ 清空所有非英文翻译
 * locale="zh"         → 只清空中文翻译
 */
export async function POST(req: Request) {
  requireAuth();

  const body = await req.json().catch(() => ({}));
  const locale = body.locale || "all";

  const where = locale === "all" ? { locale: { not: "en" } } : { locale };

  const [deletedPages, deletedProducts, deletedPosts, deletedCategories] = await Promise.all([
    prisma.page.deleteMany({ where }),
    prisma.product.deleteMany({ where }),
    prisma.post.deleteMany({ where }),
    prisma.category.deleteMany({ where }),
  ]);

  // Also clean up job files so history doesn't show stale data
  const fs = await import("fs");
  const path = await import("path");
  const jobsDir = path.join(process.cwd(), "data", "translation-jobs");
  if (fs.existsSync(jobsDir)) {
    const files = fs.readdirSync(jobsDir);
    for (const f of files) {
      fs.unlinkSync(path.join(jobsDir, f));
    }
  }

  return Response.json({
    success: true,
    summary: {
      pages: deletedPages.count,
      products: deletedProducts.count,
      posts: deletedPosts.count,
      categories: deletedCategories.count,
    },
  });
}
