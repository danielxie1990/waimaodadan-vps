import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.productCategory.findMany({
    distinct: ["slug"],
    select: { name: true, slug: true },
    orderBy: { slug: "asc" },
  });
  console.log(JSON.stringify(cats, null, 2));
  console.log("Total distinct:", cats.length);
  await prisma.$disconnect();
}
main();
