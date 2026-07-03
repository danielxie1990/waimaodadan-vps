export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSmtpConfig, isSmtpConfigured, createTransporter } from "@/lib/smtp";

// 生成 6 位验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/forgot-password — 发送验证码到用户邮箱
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 查找用户
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 不暴露用户是否存在
      return NextResponse.json({
        message: "If this email is registered, a verification code has been sent.",
      });
    }

    // 检查 SMTP 是否配置
    const smtp = await getSmtpConfig();
    if (!isSmtpConfigured(smtp)) {
      return NextResponse.json({
        error: "SMTP not configured. Please configure SMTP settings in the admin panel first.",
      }, { status: 400 });
    }

    // 生成 6 位验证码
    const code = generateCode();

    // 删除该邮箱旧的未使用验证码
    await prisma.passwordResetToken.deleteMany({
      where: { email, used: false },
    });

    // 保存新验证码（10 分钟有效）
    await prisma.passwordResetToken.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        userId: user.id,
      },
    });

    // 发送邮件
    const transporter = createTransporter(smtp);
    const fromEmail = smtp.smtp_from_email || smtp.smtp_user;
    const fromName = smtp.smtp_from_name || "Admin Panel";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #1e293b; color: #fff; padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">Password Reset</h2>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 14px; margin-bottom: 20px;">
            You requested to reset your password. Use the verification code below:
          </p>
          <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin-bottom: 20px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2563eb;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 12px;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "Password Reset Code - Admin Panel",
      html,
    });

    return NextResponse.json({
      message: "If this email is registered, a verification code has been sent.",
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: err.message || "Failed to send reset code" }, { status: 500 });
  }
}
