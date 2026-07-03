export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest, notFound } from "@/lib/api";

// GET /api/products/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      categories: true,
      images: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      tabs: { orderBy: { sortOrder: "asc" } },
      type: true,
    },
  });
  if (!product) return notFound("Product not found");
  return ok(product);
}

// PUT /api/products/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  const body = await req.json();
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return notFound("Product not found");

  // Update categories if provided
  if (body.categories) {
    await prisma.productCategory.deleteMany({ where: { productId: id } });
    if (body.categories.length > 0) {
      await prisma.productCategory.createMany({
        data: body.categories.map((c: { name: string; slug: string }) => ({
          name: c.name,
          slug: c.slug,
          productId: id,
        })),
      });
    }
  }

  // Update images if provided
  if (body.images) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    if (body.images.length > 0) {
      await prisma.productImage.createMany({
        data: body.images.map((img: any, i: number) => ({
          url: typeof img === 'string' ? img : img.url,
          alt: typeof img === 'string' ? (body.title || existing.title) : (img.alt || body.title || existing.title),
          sortOrder: i,
          productId: id,
        })),
      });
    }
  }

  // Update specs if provided
  if (body.specs) {
    await prisma.productSpec.deleteMany({ where: { productId: id } });
    if (body.specs.length > 0) {
      await prisma.productSpec.createMany({
        data: body.specs.map((s: any, i: number) => ({
          label: s.label,
          value: s.value,
          sortOrder: i,
          productId: id,
        })),
      });
    }
  }

  // Update tabs if provided
  if (body.tabs) {
    await prisma.productTab.deleteMany({ where: { productId: id } });
    if (body.tabs.length > 0) {
      await prisma.productTab.createMany({
        data: body.tabs.map((t: any, i: number) => ({
          icon: t.icon || 'fa-file-lines',
          name: t.name || 'Tab',
          content: t.content || '',
          sortOrder: i,
          productId: id,
        })),
      });
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      title: body.title,
      slug: body.slug,
      description: body.description,
      moreDescription: body.moreDescription,
      image: body.image,
      shape: body.shape,
      diameter: body.diameter,
      height: body.height,
      width: body.width,
      length: body.length,
      depth: body.depth,
      volume: body.volume,
      weight: body.weight,
      tinplate: body.tinplate,
      sku: body.sku,
      published: body.published,
      locale: body.locale,
      typeId: body.typeId ?? undefined,
      tabTemplateId: body.tabTemplateId ?? undefined,
      video: body.video ?? undefined,
      metaTitle: body.metaTitle ?? undefined,
      metaDesc: body.metaDesc ?? undefined,
      targetKeyword: body.targetKeyword ?? undefined,
      keywords: body.keywords ?? undefined,
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

// DELETE /api/products/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth();
  const id = parseInt(params.id);
  if (isNaN(id)) return badRequest("Invalid id");

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return notFound("Product not found");

  // Cascade: delete item + all its translations
  await prisma.product.deleteMany({
    where: {
      OR: [
        { id },
        { translationGroupId: `product-${id}` },
      ],
    },
  });
  return ok({ deleted: true });
}
