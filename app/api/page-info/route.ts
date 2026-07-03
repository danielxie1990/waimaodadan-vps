export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok } from "@/lib/api";

// GET /api/admin/page-info?path=/about
// Returns page/product/post info for the given path
export async function GET(req: NextRequest) {
  requireAuth();
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "";

  const slug = path.replace(/^\/|\/$/g, "").split("/").pop() || "";

  // Homepage — find page with slug "home" or empty slug
  if (!slug || slug === "") {
    const homePage = await prisma.page.findFirst({
      where: { slug: "home" },
      select: { id: true, title: true },
    });
    if (homePage) return ok({ id: homePage.id, type: "page", name: homePage.title });
  }

  // Try pages
  const page = await prisma.page.findFirst({
    where: { slug },
    select: { id: true, title: true },
  });
  if (page) return ok({ id: page.id, type: "page", name: page.title });

  // Try products
  const product = await prisma.product.findFirst({
    where: { slug },
    select: { id: true, title: true },
  });
  if (product) return ok({ id: product.id, type: "product", name: product.title });

  // Try posts
  const post = await prisma.post.findFirst({
    where: { slug },
    select: { id: true, title: true },
  });
  if (post) return ok({ id: post.id, type: "post", name: post.title });

  return ok({ id: null, type: null, name: null });
}
