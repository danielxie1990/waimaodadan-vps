export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest } from "@/lib/api";

// GET /api/categories?locale=en
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale");
  const where: any = {};
  if (locale) where.locale = locale;

  const categories = await prisma.category.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });
  return ok(categories);
}

// POST /api/categories
export async function POST(req: NextRequest) {
  requireAuth();
  const body = await req.json();
  if (!body.name || !body.slug) return badRequest("Name and slug required");

  const category = await prisma.category.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description || "",
      image: body.image || null,
      sortOrder: body.sortOrder || 0,
      locale: body.locale || "en",
    },
  });

  return ok(category);
}
