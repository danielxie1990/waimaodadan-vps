export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

// 从 DB 加载 SMTP 配置
async function getSmtpConfig() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: { in: ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from_email", "smtp_from_name"] },
    },
  });
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return map;
}

// POST /api/email — 发送邮件
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, message, from_name, reply_to } = body;

    if (!to && !body.to_smtp) {
      // 如果没有指定收件人，从设置获取
      const settings = await getSmtpConfig();
      if (!settings.smtp_from_email) {
        return Response.json({ error: "SMTP not configured" }, { status: 400 });
      }
    }

    const smtp = await getSmtpConfig();

    if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) {
      return Response.json({ error: "SMTP not configured" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: parseInt(smtp.smtp_port || "587"),
      secure: smtp.smtp_port === "465",
      auth: {
        user: smtp.smtp_user,
        pass: smtp.smtp_pass,
      },
    });

    const fromEmail = smtp.smtp_from_email || smtp.smtp_user;
    const fromName = smtp.smtp_from_name || "Website Contact";

    // 构建 HTML 邮件
    const htmlMessage = message
      ? `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
          <div style="background:#f8f8f8;padding:20px;border-radius:8px">
            ${message.replace(/\n/g, "<br/>")}
          </div>
          <p style="color:#999;font-size:12px;margin-top:20px">
            Sent from gytinbox.com contact form
          </p>
        </div>`
      : "";

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to || fromEmail,
      subject: subject || "New Contact Form Submission",
      html: htmlMessage || "<p>No message content.</p>",
    };

    if (reply_to) {
      mailOptions.replyTo = reply_to;
    }

    await transporter.sendMail(mailOptions);

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("Email send error:", err);
    return Response.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
