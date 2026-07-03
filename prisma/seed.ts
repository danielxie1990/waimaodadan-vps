import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── 1. Admin User ───────────────────────────
  const adminEmail = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password: bcrypt.hashSync("admin123", 10),
      },
    });
    console.log("  ✅ Admin user created (admin@example.com / admin123)");
  } else {
    console.log("  ℹ️  Admin user already exists");
  }

  // ─── 2. Default Custom Field Groups ─────────
  const pt1 = await prisma.productType.upsert({
    where: { slug: "general" },
    update: {},
    create: {
      name: "General Specs",
      slug: "general",
      specFields: JSON.stringify([
        { label: "Weight", type: "number", unit: "g", placeholder: "e.g. 500", required: false, defaultValue: "", options: [] },
        { label: "Material", type: "text", unit: "", placeholder: "e.g. Stainless Steel", required: false, defaultValue: "", options: [] },
        { label: "Color", type: "select", unit: "", placeholder: "Select color", required: false, defaultValue: "", options: ["Red", "Blue", "Black", "White", "Custom"] },
        { label: "Dimensions", type: "text", unit: "cm", placeholder: "e.g. 10x20x30", required: false, defaultValue: "", options: [] },
      ]),
    },
  });
  console.log("  ✅ Default custom field group created");

  const pt2 = await prisma.productType.upsert({
    where: { slug: "detailed" },
    update: {},
    create: {
      name: "Detailed Specs",
      slug: "detailed",
      specFields: JSON.stringify([
        { label: "Description", type: "textarea", unit: "", placeholder: "Detailed product description...", required: true, defaultValue: "", options: [] },
        { label: "Weight", type: "number", unit: "kg", placeholder: "e.g. 1.5", required: true, defaultValue: "", options: [] },
        { label: "Material", type: "text", unit: "", placeholder: "e.g. Oak Wood", required: false, defaultValue: "", options: [] },
        { label: "Color", type: "multiselect", unit: "", placeholder: "", required: false, defaultValue: "", options: ["Red", "Blue", "Green", "Yellow", "Purple"] },
        { label: "In Stock", type: "checkbox", unit: "", placeholder: "", required: false, defaultValue: "true", options: [] },
        { label: "Warranty", type: "select", unit: "", placeholder: "", required: false, defaultValue: "1 Year", options: ["None", "6 Months", "1 Year", "2 Years", "5 Years"] },
      ]),
    },
  });
  console.log("  ✅ Detailed custom field group created");

  // ─── 3. Sample Pages ─────────────────────────
  const samplePages = [
    {
      slug: "home",
      title: "Home",
      content: "",
      metaTitle: "Welcome",
      metaDesc: "Welcome to our store",
    },
    {
      slug: "about",
      title: "About Us",
      content: "<h2>About Our Company</h2><p>We are a professional manufacturer with years of experience serving global clients. Our commitment to quality and customer satisfaction sets us apart.</p>",
      metaTitle: "About Us",
      metaDesc: "Learn more about our company and what we do.",
    },
    {
      slug: "contact",
      title: "Contact Us",
      content: "<h2>Get In Touch</h2><p>Have a question or want to work with us? Get in touch!</p>",
      metaTitle: "Contact Us",
      metaDesc: "Contact us for inquiries and support.",
    },
    {
      slug: "products",
      title: "Products",
      content: "",
      metaTitle: "Our Products",
      metaDesc: "Browse our complete range of products.",
    },
  ];

  for (const page of samplePages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: { title: page.title, content: page.content },
      create: page,
    });
  }
  console.log(`  ✅ ${samplePages.length} sample pages created`);

  // ─── 4. Sample Products ─────────────────────
  const sampleProducts = [
    {
      slug: "sample-product-1",
      title: "Sample Product 1",
      description: "<p>This is a sample product. Replace this with your actual product description.</p>",
      typeId: pt1.id,
      specs: [
        { label: "Weight", value: "500", sortOrder: 0 },
        { label: "Material", value: "Premium Quality", sortOrder: 1 },
        { label: "Color", value: "Black", sortOrder: 2 },
        { label: "Dimensions", value: "10x20x30", sortOrder: 3 },
      ],
    },
    {
      slug: "sample-product-2",
      title: "Sample Product 2",
      description: "<p>This is another sample product. Edit it in the admin panel to add your product details.</p>",
      typeId: pt2.id,
      specs: [
        { label: "Description", value: "A high-quality product with excellent durability.", sortOrder: 0 },
        { label: "Weight", value: "1.5", sortOrder: 1 },
        { label: "Material", value: "Oak Wood", sortOrder: 2 },
        { label: "Color", value: "Red", sortOrder: 3 },
        { label: "In Stock", value: "true", sortOrder: 4 },
        { label: "Warranty", value: "2 Years", sortOrder: 5 },
      ],
    },
  ];

  for (const p of sampleProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        typeId: p.typeId,
        published: true,
        specs: p.specs?.length
          ? { create: p.specs.map((s: any) => ({ label: s.label, value: s.value, sortOrder: s.sortOrder })) }
          : undefined,
      },
    });
  }
  console.log(`  ✅ ${sampleProducts.length} sample products created`);

  // ─── 5. Sample Blog Post ─────────────────────
  const samplePosts = [
    {
      slug: "welcome-to-our-blog",
      title: "Welcome to Our Blog",
      content: "<p>Welcome to our company blog. We'll be sharing updates, industry insights, and product information here.</p>",
      excerpt: "Welcome to our company blog.",
    },
  ];

  for (const post of samplePosts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }
  console.log(`  ✅ ${samplePosts.length} sample blog posts created`);

  // ─── 6. Site Settings ────────────────────────
  const defaultSettings: Record<string, string> = {
    site_name: "My Company",
    site_tagline: "Your trusted partner for quality products.",
    site_description: "Professional manufacturer with years of experience serving global clients.",
    contact_email: "contact@example.com",
    contact_phone: "+1 (555) 000-0000",
    address: "Your Address Here",
    product_label: "Products",
    product_slug: "products",
    category_slug: "categories",
    cta_text: "Contact Us",
    cta_url: "/contact",
    inquiry_button_text: "Send Inquiry",
    back_to_catalog_text: "Back to Catalog",
    specs_label: "Specifications",
    admin_brand: "Admin Panel",
    footer_text: "All rights reserved.",
    enable_lang_switcher: "true",
    show_cta_button: "true",
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  console.log("  ✅ Default settings created");

  console.log("\n✅ Seed complete!");
  console.log("   Admin login: admin@example.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
