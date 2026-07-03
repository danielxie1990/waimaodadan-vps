export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { badRequest, unauthorized } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return badRequest("Email and password required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      return unauthorized();
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name });

    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    return res;
  } catch {
    return badRequest("Invalid request");
  }
}
