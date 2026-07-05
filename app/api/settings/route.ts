export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest } from "@/lib/api";

// GET /api/settings
export async function GET() {
  const settings = await prisma.siteSetting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return ok(map);
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  requireAuth();
  const body = await req.json();

  for (const [key, value] of Object.entries(body)) {
    if (typeof key !== "string") continue;
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });
  }

  // Invalidate settings cache so frontend picks up changes immediately
  const { invalidateCache } = await import("@/lib/db");
  invalidateCache("SETTINGS");

  return ok({ saved: true });
}
