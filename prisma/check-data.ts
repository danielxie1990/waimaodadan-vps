import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pages = await prisma.page.findMany({ orderBy: { id: "asc" } });
  for (const pg of pages) {
    console.log(`[${pg.id}] slug=${pg.slug} title="${pg.title}" hasContent=${(pg.content || "").length > 0} contentLen=${(pg.content || "").length}`);
  }

  console.log("\n--- Posts ---");
  const posts = await prisma.post.findMany({ orderBy: { id: "asc" } });
  for (const p of posts) {
    console.log(`[${p.id}] slug=${p.slug} title="${p.title}" hasContent=${(p.content || "").length > 0} contentLen=${(p.content || "").length}`);
  }

  console.log("\n--- Products (first 5) ---");
  const prods = await prisma.product.findMany({ take: 5, orderBy: { id: "asc" } });
  for (const p of prods) {
    console.log(`[${p.id}] slug=${p.slug} title="${p.title}" hasDesc=${(p.description || "").length > 0} descLen=${(p.description || "").length}`);
  }

  await prisma.$disconnect();
}
main();
