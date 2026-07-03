import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users found:", users.length);
  users.forEach((u) => {
    console.log(`  - id=${u.id} email=${u.email} name=${u.name}`);
  });

  const pages = await prisma.page.count();
  console.log("Total pages:", pages);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
