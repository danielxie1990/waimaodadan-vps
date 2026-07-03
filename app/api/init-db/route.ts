export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

/**
 * GET /api/init-db
 * 一次性接口：创建数据表 + 种子数据
 * 访问 https://fulimachine.com/api/init-db 即可
 */
export async function GET() {
  // 创建一个独立连接，避免影响主 prisma 实例
  const initPrisma = new PrismaClient();

  try {
    // 1. 检查是否已有数据
    try {
      const count = await initPrisma.user.count();
      if (count > 0) {
        await initPrisma.$disconnect();
        return NextResponse.json({
          status: "already_initialized",
          message: "✅ Database already has data. No action needed.",
          login: { url: "/admin/login/", email: "admin@example.com", password: "admin123" },
        });
      }
    } catch {
      // 表不存在，继续
    }

    // 2. 创建所有表（SQLite 兼容）
    const createTables = `
      CREATE TABLE IF NOT EXISTS "User" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "email" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" INTEGER,
        FOREIGN KEY ("userId") REFERENCES "User"("id")
      );
      CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_email_code" ON "password_reset_tokens"("email", "code");

      CREATE TABLE IF NOT EXISTS "Page" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "slug" TEXT NOT NULL UNIQUE,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL DEFAULT '',
        "metaTitle" TEXT,
        "metaDesc" TEXT,
        "targetKeyword" TEXT,
        "templateSlug" TEXT NOT NULL DEFAULT 'default',
        "locale" TEXT NOT NULL DEFAULT 'en',
        "translationGroupId" TEXT,
        "published" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "categories" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT NOT NULL DEFAULT '',
        "image" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "locale" TEXT NOT NULL DEFAULT 'en',
        "translationGroupId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "product_types" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "specFields" TEXT NOT NULL DEFAULT '[]',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Product" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "legacyId" INTEGER,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT NOT NULL DEFAULT '',
        "image" TEXT,
        "shape" TEXT,
        "diameter" TEXT,
        "height" TEXT,
        "width" TEXT,
        "length" TEXT,
        "depth" TEXT,
        "volume" TEXT,
        "weight" TEXT,
        "tinplate" TEXT,
        "sku" TEXT,
        "application" TEXT,
        "keywords" TEXT,
        "metaTitle" TEXT,
        "metaDesc" TEXT,
        "targetKeyword" TEXT,
        "video" TEXT,
        "supplierId" INTEGER,
        "locale" TEXT NOT NULL DEFAULT 'en',
        "translationGroupId" TEXT,
        "published" BOOLEAN NOT NULL DEFAULT true,
        "moreDescription" TEXT NOT NULL DEFAULT '',
        "typeId" INTEGER,
        "tabTemplateId" INTEGER,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("typeId") REFERENCES "product_types"("id"),
        FOREIGN KEY ("tabTemplateId") REFERENCES "tab_templates"("id")
      );

      CREATE TABLE IF NOT EXISTS "tab_templates" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "tabDefs" TEXT NOT NULL DEFAULT '[]',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "product_tabs" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "productId" INTEGER NOT NULL,
        "icon" TEXT NOT NULL DEFAULT 'fa-file-lines',
        "name" TEXT NOT NULL DEFAULT 'Tab',
        "content" TEXT NOT NULL DEFAULT '',
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "idx_product_tabs_productId" ON "product_tabs"("productId");

      CREATE TABLE IF NOT EXISTS "product_specs" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "productId" INTEGER NOT NULL,
        "label" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "idx_product_specs_productId" ON "product_specs"("productId");

      CREATE TABLE IF NOT EXISTS "ProductCategory" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "productId" INTEGER NOT NULL,
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_product_category_unique" ON "ProductCategory"("slug", "productId");
      CREATE INDEX IF NOT EXISTS "idx_product_category_slug" ON "ProductCategory"("slug");

      CREATE TABLE IF NOT EXISTS "ProductImage" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "url" TEXT NOT NULL,
        "alt" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "productId" INTEGER NOT NULL,
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "idx_product_image_productId" ON "ProductImage"("productId");

      CREATE TABLE IF NOT EXISTS "Post" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "legacyId" INTEGER,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "content" TEXT NOT NULL DEFAULT '',
        "excerpt" TEXT NOT NULL DEFAULT '',
        "metaTitle" TEXT,
        "metaDesc" TEXT,
        "image" TEXT,
        "locale" TEXT NOT NULL DEFAULT 'en',
        "translationGroupId" TEXT,
        "published" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Media" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "filename" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "width" INTEGER,
        "height" INTEGER,
        "fileSize" INTEGER,
        "alt" TEXT,
        "category" TEXT NOT NULL DEFAULT 'image',
        "webpUrl" TEXT,
        "thumbUrl" TEXT,
        "mediumUrl" TEXT,
        "deletedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "SiteSetting" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL DEFAULT ''
      );
    `;

    // 分批执行，避免 SQLite 一次执行太多语句
    const statements = createTables.split(";").filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await initPrisma.$executeRawUnsafe(stmt.trim() + ";");
      }
    }

    // 3. 创建管理员账号
    const bcrypt = await import("bcryptjs");
    const adminEmail = "admin@example.com";
    const existingUser = await initPrisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingUser) {
      await initPrisma.user.create({
        data: {
          name: "Admin",
          email: adminEmail,
          password: bcrypt.hashSync("admin123", 10),
        },
      });
    }

    // 4. 默认设置
    const defaults: Record<string, string> = {
      site_name: "My Company",
      site_tagline: "Your trusted partner.",
      site_description: "Professional manufacturer.",
      product_slug: "products",
      category_slug: "categories",
      cta_text: "Contact Us",
      cta_url: "/contact",
      inquiry_button_text: "Send Inquiry",
      enable_lang_switcher: "true",
      show_cta_button: "true",
      smtp_host: "",
      smtp_port: "587",
      smtp_encryption: "tls",
      smtp_autotls: "true",
      smtp_auth: "true",
      smtp_user: "",
      smtp_pass: "",
      smtp_from_email: "",
      smtp_from_name: "Admin Panel",
    };

    for (const [key, value] of Object.entries(defaults)) {
      await initPrisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }

    // 5. 默认产品类型
    await initPrisma.productType.upsert({
      where: { slug: "general" },
      update: {},
      create: {
        name: "General Specs",
        slug: "general",
        specFields: JSON.stringify([]),
      },
    });

    // 6. 默认页面
    const pages = [
      { slug: "home", title: "Home", content: "" },
      { slug: "about", title: "About Us", content: "<h2>About Us</h2><p>Welcome to our company.</p>" },
      { slug: "contact", title: "Contact Us", content: "<h2>Contact</h2><p>Get in touch with us.</p>" },
      { slug: "products", title: "Products", content: "" },
    ];
    for (const p of pages) {
      await initPrisma.page.upsert({
        where: { slug: p.slug },
        create: { ...p, metaTitle: p.title },
        update: { title: p.title },
      });
    }

    await initPrisma.$disconnect();

    return NextResponse.json({
      status: "success",
      message: "✅ Database initialized successfully! All tables created.",
      login: {
        url: "/admin/login/",
        email: "admin@example.com",
        password: "admin123",
      },
    });
  } catch (err: any) {
    await initPrisma.$disconnect().catch(() => {});
    return NextResponse.json({
      status: "error",
      error: err.message || "Unknown error",
    }, { status: 500 });
  }
}
