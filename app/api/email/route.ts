export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getSmtpConfig, isSmtpConfigured, createTransporter } from "@/lib/smtp";

// POST /api/email — 发送邮件（支持 test_mode 返回详细信息）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, message, from_name, reply_to, test_mode } = body;

    const smtp = await getSmtpConfig();

    if (!isSmtpConfigured(smtp)) {
      return Response.json({ error: "SMTP not configured. Go to Settings > SMTP Email to configure." }, { status: 400 });
    }

    const transporter = createTransporter(smtp);

    const fromEmail = smtp.smtp_from_email || smtp.smtp_user;
    const fromName = from_name || smtp.smtp_from_name || "Website Contact";

    // Build HTML
    const htmlMessage = message
      ? `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
          <div style="background:#f8f8f8;padding:20px;border-radius:8px">
            ${message.replace(/\n/g, "<br/>")}
          </div>
          <p style="color:#999;font-size:12px;margin-top:20px">
            Sent from gytinbox.com
          </p>
        </div>`
      : "";

    const mailOptions: Record<string, any> = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to || fromEmail,
      subject: subject || "New Contact Form Submission",
      html: htmlMessage || "<p>No message content.</p>",
    };

    if (reply_to) {
      mailOptions.replyTo = reply_to;
    }

    // Verify connection first (test mode)
    if (test_mode) {
      try {
        await transporter.verify();
      } catch (verifyErr: any) {
        return Response.json({
          error: "SMTP connection verification failed.",
          details: `Verification error: ${verifyErr.message || "Unknown error"}\nHost: ${smtp.smtp_host}:${smtp.smtp_port}\nEncryption: ${smtp.smtp_encryption}\nAuth: ${smtp.smtp_auth === "true" ? "Yes" : "No"}`,
        }, { status: 400 });
      }
    }

    await transporter.sendMail(mailOptions);

    const detailLines = test_mode
      ? `✓ Server: ${smtp.smtp_host}:${smtp.smtp_port}\n✓ Encryption: ${smtp.smtp_encryption}\n✓ Auth: ${smtp.smtp_auth === "true" ? "On" : "Off"}\n✓ From: ${fromEmail}\n✓ To: ${to || fromEmail}`
      : "";

    return Response.json({
      success: true,
      details: detailLines || undefined,
    });
  } catch (err: any) {
    console.error("Email send error:", err);
    return Response.json({
      error: err.message || "Failed to send email",
      details: err.code ? `Error code: ${err.code}\nCommand: ${err.command || "N/A"}\nResponse: ${err.response || "N/A"}` : undefined,
    }, { status: 500 });
  }
}
