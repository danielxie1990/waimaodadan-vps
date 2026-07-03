export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest, notFound } from "@/lib/api";

// GET /api/products/types
export async function GET() {
  const types = await prisma.productType.findMany({ orderBy: { name: "asc" } });
  return ok(types);
}

// POST /api/products/types
export async function POST(req: NextRequest) {
  requireAuth();
  const body = await req.json();
  if (!body.name || !body.slug) return badRequest("name and slug required");

  const type = await prisma.productType.create({
    data: {
      name: body.name,
      slug: body.slug,
      specFields: body.specFields || "[]",
    },
  });
  return ok(type);
}

// PUT /api/products/types
export async function PUT(req: NextRequest) {
  requireAuth();
  const body = await req.json();
  if (!body.id) return badRequest("id required");

  const type = await prisma.productType.update({
    where: { id: body.id },
    data: {
      name: body.name,
      slug: body.slug,
      specFields: body.specFields || "[]",
    },
  });
  return ok(type);
}

// DELETE /api/products/types
export async function DELETE(req: NextRequest) {
  requireAuth();
  const body = await req.json();
  if (!body.id) return badRequest("id required");

  await prisma.productType.delete({ where: { id: body.id } });
  return ok({ deleted: true });
}
