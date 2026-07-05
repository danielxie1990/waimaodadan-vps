export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest, notFound } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return notFound("Page not found");
  return ok(page);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  const body = await req.json();
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) return notFound("Page not found");

  const page = await prisma.page.update({
    where: { id },
    data: {
      title: body.title,
      slug: body.slug,
      content: body.content,
      templateSlug: body.templateSlug,
      metaTitle: body.metaTitle,
      metaDesc: body.metaDesc,
      targetKeyword: body.targetKeyword,
      published: body.published,
      locale: body.locale,
    },
  });

  // Invalidate page cache so frontend picks up changes immediately
  const { invalidateCache } = await import("@/lib/db");
  invalidateCache("PAGES");
  invalidateCache("PAGE");

  return ok(page);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  // Cascade: delete item + all its translations
  await prisma.page.deleteMany({
    where: {
      OR: [
        { id },
        { translationGroupId: `page-${id}` },
      ],
    },
  });
  return ok({ deleted: true });
}
