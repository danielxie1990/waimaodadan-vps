export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest, notFound } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return notFound("Post not found");
  return ok(post);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  const body = await req.json();
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return notFound("Post not found");

  const post = await prisma.post.update({
    where: { id },
    data: {
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt,
      metaTitle: body.metaTitle,
      metaDesc: body.metaDesc,
      image: body.image,
      published: body.published,
      locale: body.locale,
    },
  });

  return ok(post);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");
  // Cascade: delete item + all its translations
  await prisma.post.deleteMany({
    where: {
      OR: [
        { id },
        { translationGroupId: `post-${id}` },
      ],
    },
  });
  return ok({ deleted: true });
}
