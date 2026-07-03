export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireAuth, ok } from "@/lib/api";

// GET /api/media/months — returns all year-month groups
export async function GET() {
  requireAuth();

  const media = await prisma.media.findMany({
    where: { deletedAt: null },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const months = new Set<string>();
  for (const m of media) {
    const key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, "0")}`;
    months.add(key);
  }

  return ok(Array.from(months).sort().reverse());
}
