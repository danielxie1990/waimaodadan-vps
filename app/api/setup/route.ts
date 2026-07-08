export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

/**
 * GET /api/setup — check if setup is needed
 */
export async function GET() {
  try {
    // Run pending migrations automatically
    const { execSync } = await import("child_process");
    try {
      execSync("npx prisma migrate deploy", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 30000,
      });
    } catch {
      // migrations already applied or no migration tool — continue
    }

    // Check if admin exists
    const adminCount = await prisma.user.count();
    const setupComplete = await prisma.siteSetting.findUnique({
      where: { key: "setup_complete" },
    });

    return NextResponse.json({
      needsSetup: adminCount === 0 || setupComplete?.value !== "true",
      adminExists: adminCount > 0,
      hasAdmin: adminCount > 0,
    });
  } catch (err: any) {
    // Database not ready yet — definitely needs setup
    return NextResponse.json({
      needsSetup: true,
      adminExists: false,
      hasAdmin: false,
      error: err?.message || null,
    });
  }
}

/**
 * POST /api/setup — run initial setup
 *
 * Body: {
 *   siteName: string,
 *   adminName: string,
 *   adminEmail: string,
 *   adminPassword: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Prevent re-running setup
    const existing = await prisma.siteSetting.findUnique({
      where: { key: "setup_complete" },
    });
    if (existing?.value === "true") {
      return NextResponse.json(
        { error: "Setup already completed." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { siteName, adminName, adminEmail, adminPassword } = body;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Admin email and password are required." },
        { status: 400 }
      );
    }

    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // ─── 1. Run migrations (safe — no-op if already applied) ──
    try {
      const { execSync } = await import("child_process");
      execSync("npx prisma migrate deploy", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 30000,
      });
    } catch {
      // ignore
    }

    // ─── 2. Create or update admin user ──
    const existingAdmin = await prisma.user.findFirst();
    let admin;
    if (existingAdmin) {
      admin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          name: adminName || "Admin",
          email: adminEmail,
          password: hashPassword(adminPassword),
        },
      });
    } else {
      admin = await prisma.user.create({
        data: {
          name: adminName || "Admin",
          email: adminEmail,
          password: hashPassword(adminPassword),
        },
      });
    }

    // ─── 3. Default settings ──
    const defaults: Record<string, string> = {
      site_name: siteName || "My Company",
      site_tagline: "Professional manufacturer serving global clients.",
      site_description: "We provide high-quality products with reliable service.",
      admin_brand: siteName || "Admin Panel",
      product_slug: "products",
      category_slug: "categories",
      inquiry_button_text: "SEND INQUIRY",
      back_to_catalog_text: "Back to Catalog",
      primary_color: "#065f46",
      specs_label: "Specifications",
      noindex: "true", // default: hide from search engines until customer goes live
    };

    for (const [key, value] of Object.entries(defaults)) {
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }

    // ─── 4. Mark setup complete ──
    await prisma.siteSetting.upsert({
      where: { key: "setup_complete" },
      create: { key: "setup_complete", value: "true" },
      update: { value: "true" },
    });

    // ─── 5. Seed demo data (if no products exist) ──
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      try {
        const { execSync } = await import("child_process");
        execSync("npx tsx prisma/seed.ts", {
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 60000,
        });
      } catch (err) {
        console.warn("[setup] Seed skipped or failed (non-fatal):", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "✅ Setup complete! You can now log in.",
      admin: {
        email: adminEmail,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Setup failed. Please try again." },
      { status: 500 }
    );
  }
}
