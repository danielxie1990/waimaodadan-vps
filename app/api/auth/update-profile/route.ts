export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

// POST /api/auth/update-profile — 更新用户名称和邮箱
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // 检查邮箱是否被其他用户使用
    if (email !== auth.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== auth.userId) {
        return NextResponse.json({ error: "This email is already in use" }, { status: 400 });
      }
    }

    // 更新用户
    await prisma.user.update({
      where: { id: auth.userId },
      data: { name, email },
    });

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
