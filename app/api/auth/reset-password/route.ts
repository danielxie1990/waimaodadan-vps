export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// POST /api/auth/reset-password — 验证验证码并重置密码
export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // 查找有效的验证码
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // 验证码标记为已使用
    await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { used: true },
    });

    // 更新密码
    await prisma.user.update({
      where: { email },
      data: { password: hashPassword(newPassword) },
    });

    return NextResponse.json({ message: "Password has been reset successfully. You can now login with your new password." });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: err.message || "Failed to reset password" }, { status: 500 });
  }
}
