export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest, notFound } from "@/lib/api";
import { unlink } from "fs/promises";
import path from "path";

// DELETE /api/media/[id] — soft delete if active, permanent if already trashed
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return notFound("Media not found");

  // If already in trash, permanently delete
  if (media.deletedAt) {
    try {
      const filePath = path.join(process.cwd(), "public", media.url);
      await unlink(filePath);
    } catch { /* file may not exist */ }
    await prisma.media.delete({ where: { id } });
    return ok({ deleted: true, permanent: true });
  }

  // Soft delete → move to trash
  await prisma.media.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return ok({ deleted: true, trash: true });
}
