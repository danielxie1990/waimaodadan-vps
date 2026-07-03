export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest } from "@/lib/api";

// POST /api/media/[id]/restore — restore from trash
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  await prisma.media.update({
    where: { id },
    data: { deletedAt: null },
  });
  return ok({ restored: true });
}
