import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 从现有 ProductCategory 获取所有唯一的分类
  const cats = await prisma.productCategory.findMany({
    distinct: ["slug"],
    select: { name: true, slug: true },
    orderBy: { slug: "asc" },
  });

  console.log(`Found ${cats.length} existing categories from products.`);

  let created = 0;
  let skipped = 0;

  for (const cat of cats) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: "",
        image: null,
        sortOrder: created,
      },
    });
    created++;
  }

  console.log(`Created: ${created}, Skipped (already exist): ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
