export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { badRequest, unauthorized } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

const LOGIN_RATE_LIMIT = {
  maxRequests: 5,         // 5 attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
  errorMessage: "Too many login attempts. Please try again in 15 minutes.",
};

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ──
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    const rateCheck = checkRateLimit(ip, LOGIN_RATE_LIMIT);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: LOGIN_RATE_LIMIT.errorMessage },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const { email, password } = await req.json();
    if (!email || !password) return badRequest("Email and password required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      return unauthorized();
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      remainingAttempts: rateCheck.remaining - 1,
    });

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
