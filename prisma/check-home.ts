import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  const home = await prisma.page.findUnique({ where: { slug: "home" } });
  console.log("Content length:", home?.content?.length || 0);
  if (home?.content) {
    console.log("First 400 chars:");
    console.log(home.content.slice(0, 400));
  }
  await prisma.$disconnect();
}
main();
