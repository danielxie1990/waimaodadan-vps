export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest } from "@/lib/api";

// GET /api/pages?locale=en
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale");

  const where: any = {};
  if (locale) where.locale = locale;

  const pages = await prisma.page.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });
  return ok(pages);
}

// POST /api/pages
export async function POST(req: NextRequest) {
  requireAuth();
  const body = await req.json();
  if (!body.title || !body.slug) return badRequest("Title and slug required");

  const page = await prisma.page.create({
    data: {
      slug: body.slug,
      title: body.title,
      content: body.content || "",
      templateSlug: body.templateSlug || "default",
      metaTitle: body.metaTitle || null,
      metaDesc: body.metaDesc || null,
      targetKeyword: body.targetKeyword || null,
      locale: body.locale || "en",
      published: body.published ?? true,
    },
  });

  return ok(page);
}
