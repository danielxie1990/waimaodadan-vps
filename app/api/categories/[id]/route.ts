export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest, notFound } from "@/lib/api";

// GET /api/categories/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return notFound("Category not found");
  return ok(category);
}

// PUT /api/categories/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  const body = await req.json();
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return notFound("Category not found");

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      image: body.image,
      sortOrder: body.sortOrder,
    },
  });

  return ok(category);
}

// DELETE /api/categories/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return notFound("Category not found");
  await prisma.category.delete({ where: { id } });
  return ok({ deleted: true });
}
