export const dynamic = "force-dynamic";

import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/lib/api";

export async function GET() {
  const auth = getAuthFromCookies();
  if (!auth) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) return unauthorized();

  return Response.json({ user });
}
