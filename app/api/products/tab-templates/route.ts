export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest, notFound } from "@/lib/api";

// GET /api/products/tab-templates
export async function GET() {
  const templates = await prisma.tabTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });
  return ok(templates);
}

// POST /api/products/tab-templates
export async function POST(req: NextRequest) {
  requireAuth();
  const body = await req.json();
  if (!body.name || !body.slug) return badRequest("Name and slug required");

  const template = await prisma.tabTemplate.create({
    data: {
      name: body.name,
      slug: body.slug,
      tabDefs: body.tabDefs || "[]",
    },
  });

  return ok(template);
}

// PUT /api/products/tab-templates
export async function PUT(req: NextRequest) {
  requireAuth();
  const body = await req.json();
  const id = parseInt(body.id);
  if (isNaN(id)) return badRequest("Invalid id");

  const existing = await prisma.tabTemplate.findUnique({ where: { id } });
  if (!existing) return notFound("Template not found");

  const template = await prisma.tabTemplate.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug,
      tabDefs: body.tabDefs || "[]",
    },
  });

  return ok(template);
}

// DELETE /api/products/tab-templates
export async function DELETE(req: NextRequest) {
  requireAuth();
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "");
  if (isNaN(id)) return badRequest("Invalid id");

  await prisma.tabTemplate.delete({ where: { id } });
  return ok({ deleted: true });
}
