import { prisma } from "./prisma";
import nodemailer from "nodemailer";

export interface SmtpConfig {
  smtp_host: string;
  smtp_port: string;
  smtp_encryption: string; // "none" | "ssl" | "tls"
  smtp_autotls: string;    // "true" | "false"
  smtp_auth: string;       // "true" | "false"
  smtp_user: string;
  smtp_pass: string;
  smtp_from_email: string;
  smtp_from_name: string;
}

const SMTP_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_encryption",
  "smtp_autotls",
  "smtp_auth",
  "smtp_user",
  "smtp_pass",
  "smtp_from_email",
  "smtp_from_name",
] as const;

/**
 * 从 DB 加载 SMTP 配置
 */
export async function getSmtpConfig(): Promise<SmtpConfig> {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: SMTP_KEYS as unknown as string[] } },
  });
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return {
    smtp_host: map.smtp_host || "",
    smtp_port: map.smtp_port || "587",
    smtp_encryption: map.smtp_encryption || "tls",
    smtp_autotls: map.smtp_autotls || "true",
    smtp_auth: map.smtp_auth || "true",
    smtp_user: map.smtp_user || "",
    smtp_pass: map.smtp_pass || "",
    smtp_from_email: map.smtp_from_email || "",
    smtp_from_name: map.smtp_from_name || "Admin Panel",
  };
}

/**
 * 检查 SMTP 是否已配置
 */
export function isSmtpConfigured(config: SmtpConfig): boolean {
  return !!(config.smtp_host && config.smtp_user && config.smtp_pass);
}

/**
 * 根据配置创建 nodemailer transporter
 */
export function createTransporter(config: SmtpConfig) {
  const port = parseInt(config.smtp_port || "587");

  // 根据 encryption 设置 secure
  let secure = false;
  let ignoreTLS = false;
  let requireTLS = false;

  switch (config.smtp_encryption) {
    case "ssl":
      secure = true;
      break;
    case "tls":
      secure = false; // STARTTLS
      break;
    case "none":
      secure = false;
      ignoreTLS = true;
      break;
  }

  // Auto TLS: 当启用时，如果服务器不支持 STARTTLS 则拒绝
  if (config.smtp_autotls === "true" && !ignoreTLS) {
    requireTLS = true;
  }

  const transporterOptions: nodemailer.TransportOptions = {
    host: config.smtp_host,
    port,
    secure,
    ...(process.env.NODE_ENV === 'development' ? {
      tls: { rejectUnauthorized: false },
    } : {}),
  } as any;

  // ignoreTLS
  if (ignoreTLS) {
    (transporterOptions as any).ignoreTLS = true;
  }

  // requireTLS
  if (requireTLS) {
    (transporterOptions as any).requireTLS = true;
  }

  // Auth
  if (config.smtp_auth !== "false" && config.smtp_user && config.smtp_pass) {
    (transporterOptions as any).auth = {
      user: config.smtp_user,
      pass: config.smtp_pass,
    };
  }

  return nodemailer.createTransport(transporterOptions);
}
