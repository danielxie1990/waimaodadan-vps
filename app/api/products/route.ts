export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest, notFound } from "@/lib/api";

// GET /api/products?published=true&locale=en
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const published = searchParams.get("published");
  const locale = searchParams.get("locale");

  const where: any = {};
  if (published === "true") where.published = true;
  if (locale) where.locale = locale;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      categories: true,
      images: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      tabs: { orderBy: { sortOrder: "asc" } },
      type: true,
    },
  });

  return ok(products);
}

// POST /api/products
export async function POST(req: NextRequest) {
  requireAuth();
  const body = await req.json();

  const product = await prisma.product.create({
    data: {
      legacyId: body.legacyId,
      title: body.title,
      slug: body.slug,
      description: body.description || "",
      moreDescription: body.moreDescription || "",
      image: body.image || null,
      shape: body.shape || null,
      diameter: body.diameter || null,
      height: body.height || null,
      width: body.width || null,
      length: body.length || null,
      depth: body.depth || null,
      volume: body.volume || null,
      weight: body.weight || null,
      tinplate: body.tinplate || null,
      sku: body.sku || null,
      published: body.published ?? true,
      typeId: body.typeId || undefined,
      tabTemplateId: body.tabTemplateId || undefined,
      video: body.video || null,
      metaTitle: body.metaTitle || null,
      metaDesc: body.metaDesc || null,
      targetKeyword: body.targetKeyword || null,
      keywords: body.keywords || null,
      categories: body.categories?.length
        ? { create: body.categories.map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug })) }
        : undefined,
      images: body.images?.length
        ? { create: body.images.map((img: any, i: number) => ({
            url: typeof img === 'string' ? img : img.url,
            alt: typeof img === 'string' ? (body.title || '') : (img.alt || body.title || ''),
            sortOrder: i,
          })) }
        : undefined,
      specs: body.specs?.length
        ? { create: body.specs.map((s: any, i: number) => ({
            label: s.label,
            value: s.value,
            sortOrder: i,
          })) }
        : undefined,
      tabs: body.tabs?.length
        ? { create: body.tabs.map((t: any, i: number) => ({
            icon: t.icon || 'fa-file-lines',
            name: t.name || 'Tab',
            content: t.content || '',
            sortOrder: i,
          })) }
        : undefined,
    },
    include: {
      categories: true,
      images: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      tabs: { orderBy: { sortOrder: "asc" } },
    },
  });

  return ok(product);
}


