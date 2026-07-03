export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok } from "@/lib/api";
import { unlink } from "fs/promises";
import path from "path";

// DELETE /api/media/trash — permanently delete all trashed media
export async function DELETE() {
  requireAuth();

  const trashed = await prisma.media.findMany({
    where: { deletedAt: { not: null } },
  });

  for (const media of trashed) {
    try {
      const filePath = path.join(process.cwd(), "public", media.url);
      await unlink(filePath);
    } catch { /* file may not exist */ }
  }

  await prisma.media.deleteMany({
    where: { deletedAt: { not: null } },
  });

  return ok({ deleted: trashed.length });
}
