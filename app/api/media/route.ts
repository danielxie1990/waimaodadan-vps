export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, badRequest } from "@/lib/api";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { optimizeImage } from "@/lib/image-optimize";

// GET /api/media?search=&category=&month=&trash=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const month = searchParams.get("month") || "";
  const trash = searchParams.get("trash") === "1";

  const where: any = {};
  if (trash) {
    where.deletedAt = { not: null };
  } else {
    where.deletedAt = null;
  }
  if (search) {
    where.filename = { contains: search };
  }
  if (category) {
    where.category = category;
  }
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.createdAt = { gte: start, lt: end };
  }

  const media = await prisma.media.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return ok(media);
}

// POST /api/media (upload file)
export async function POST(req: NextRequest) {
  requireAuth();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return badRequest("No file provided");

  const category = (formData.get("category") as string) || "image";
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  const url = `/uploads/${filename}`;

  // Generate WebP + thumbnail + medium versions
  let webpUrl: string | null = null;
  let thumbUrl: string | null = null;
  let mediumUrl: string | null = null;
  if (file.type.startsWith("image/")) {
    const result = await optimizeImage(filename, buffer, file.type);
    webpUrl = result.webpPath;
    thumbUrl = result.thumbPath;
    mediumUrl = result.mediumPath;
  }

  const media = await prisma.media.create({
    data: {
      filename: file.name,
      url,
      mimeType: file.type,
      fileSize: buffer.length,
      alt: (formData.get("alt") as string) || file.name,
      category,
      webpUrl,
      thumbUrl,
      mediumUrl,
    },
  });

  return ok(media);
}
