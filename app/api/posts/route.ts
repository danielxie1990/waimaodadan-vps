export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest } from "@/lib/api";

// GET /api/posts?published=true&locale=en
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const published = searchParams.get("published");
  const locale = searchParams.get("locale");

  const where: any = {};
  if (published === "true") where.published = true;
  if (locale) where.locale = locale;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return ok(posts);
}

// POST /api/posts
export async function POST(req: NextRequest) {
  requireAuth();
  const body = await req.json();
  if (!body.title || !body.slug) return badRequest("Title and slug required");

  const post = await prisma.post.create({
    data: {
      legacyId: body.legacyId,
      title: body.title,
      slug: body.slug,
      content: body.content || "",
      excerpt: body.excerpt || "",
      metaTitle: body.metaTitle || null,
      metaDesc: body.metaDesc || null,
      image: body.image || null,
      published: body.published ?? false,
    },
  });

  return ok(post);
}
