export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, getAuthFromCookies } from "@/lib/auth";

// POST /api/auth/change-password — 已登录用户修改密码
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    // 验证当前密码
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!verifyPassword(currentPassword, user.password)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // 更新密码
    await prisma.user.update({
      where: { id: auth.userId },
      data: { password: hashPassword(newPassword) },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (err: any) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: err.message || "Failed to change password" }, { status: 500 });
  }
}
