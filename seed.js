// seed.js — 创建管理员账号和基础数据
// 用法: node seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // 1. Admin
  if (!(await prisma.user.findUnique({ where: { email: "admin@example.com" } }))) {
    await prisma.user.create({
      data: { name: "Admin", email: "admin@example.com", password: bcrypt.hashSync("admin123", 10) },
    });
    console.log("  ✅ Admin: admin@example.com / admin123");
  }

  // 2. Default settings
  const defaults = {
    site_name: "My Company", site_tagline: "Your trusted partner.",
    site_description: "Professional manufacturer.", contact_email: "contact@example.com",
    contact_phone: "+1 (555) 000-0000", product_slug: "products", category_slug: "categories",
    cta_text: "Contact Us", cta_url: "/contact", inquiry_button_text: "Send Inquiry",
    enable_lang_switcher: "true", show_cta_button: "true",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  console.log("  ✅ Settings created");

  // 3. Sample pages
  const pages = [
    { slug: "home", title: "Home", content: "" },
    { slug: "about", title: "About Us", content: "<h2>About Us</h2><p>Welcome to our company.</p>" },
    { slug: "contact", title: "Contact Us", content: "<h2>Contact</h2><p>Get in touch.</p>" },
    { slug: "products", title: "Products", content: "" },
  ];
  for (const p of pages) {
    await prisma.page.upsert({ where: { slug: p.slug }, update: p, create: p });
  }
  console.log("  ✅ Pages created");

  console.log("\n✅ Done! Login: admin@example.com / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
