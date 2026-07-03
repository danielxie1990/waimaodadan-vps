export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderPage, renderPageMeta } from "@/lib/page-renderer";
import { getWebpUrl } from "@/lib/webp-url";
import { isLocale, DEFAULT_LOCALE, cleanSlug, localizeUrl } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/db";
import Link from "next/link";

type Props = { params: { segments: string[] }; searchParams: Record<string, string | string[] | undefined> };

function parse(segments: string[]): { locale: string; path: string } {
  if (segments.length > 0 && isLocale(segments[0])) {
    return { locale: segments[0], path: "/" + segments.slice(1).join("/") };
  }
  return { locale: DEFAULT_LOCALE, path: "/" + segments.join("/") };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, path } = parse(params.segments || []);
  if (!path || path === "/") return renderPageMeta("home", locale);
  const slug = path.slice(1);
  return renderPageMeta(slug, locale);
}

// ── Product listing page ─────────────────────
async function renderProductListing(loc: string) {
  const { renderProductListingPage } = await import("@/lib/product-page");
  return renderProductListingPage(loc);
}

// ── Product detail page ──────────────────────
async function renderProductDetail(productSlug: string, loc: string, settings: Record<string, string>) {
  const { getProductBySlug } = await import("@/lib/db");
  const product = await getProductBySlug(productSlug, loc);
  if (!product) return null;

  const images = product.images.map((i: any) => i.url);
  const hasEavSpecs = product.specs && product.specs.length > 0;
  const specs: [string, string][] = hasEavSpecs
    ? product.specs.map((s: any) => [s.label, s.value])
    : [
        ["Shape", product.shape || ""],
        ["Diameter", product.diameter ? product.diameter + " mm" : ""],
        ["Height", product.height ? product.height + " mm" : ""],
        ["Width", product.width ? product.width + " mm" : ""],
        ["Length", product.length ? product.length + " mm" : ""],
        ["Depth", product.depth ? product.depth + " mm" : ""],
        ["Weight", product.weight ? product.weight + " g" : ""],
        ["Volume", product.volume || ""],
        ["Tinplate", product.tinplate ? product.tinplate + " mm" : ""],
        ["SKU", product.sku || ""],
      ];

  const backLabel = settings.back_to_catalog_text || "Back to Catalog";
  const inquiryLabel = settings.inquiry_button_text || "Send Inquiry";
  const specsLabel = settings.specs_label || "Specifications";
  const productRoute = settings.product_slug || "products";
  const categoryRoute = settings.category_slug || "categories";

  // Import gallery dynamically
  const { default: ProductGallery } = await import("@/components/ProductGallery");
  const { PageShell } = await import("@/components/templates");

  function SpecRow({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
      <div className="flex border-b border-gray-100 py-2">
        <span className="text-gray-500 w-32 text-sm">{label}</span>
        <span className="text-gray-900 text-sm">{value}</span>
      </div>
    );
  }

  return (
    <PageShell template="blank" pageId={product.id} pageType="product">
    <div className="product-detail">
      <div className="container py-8">
        <Link href={`/${loc !== "en" ? loc + "/" : ""}${productRoute}`} className="text-red-600 hover:underline mb-6 inline-block">
          &larr; {backLabel}
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ProductGallery images={images} title={product.title} video={product.video} />
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-4">{product.title}</h1>

            <div className="flex flex-wrap gap-2 mb-6">
              {product.categories.map((c: any) => (
                <Link
                  key={c.slug}
                  href={`/${categoryRoute}/${c.slug}`}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-200"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">{specsLabel}</h3>
              {specs.map(([label, val]) => (val ? <SpecRow key={label} label={label} value={val} /> : null))}
            </div>

            {product.description && (
              <div
                className="bg-white rounded-lg border border-gray-200 p-4 mb-6 prose prose-sm max-w-none rich-content"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            <a
              href={`/${loc !== "en" ? loc + "/" : ""}contact`}
              className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
            >
              {inquiryLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
    </PageShell>
  );
}

// ── Category page ────────────────────────────
async function renderCategoryPage(catSlug: string, loc: string, settings: Record<string, string>) {
  const productRoute = settings.product_slug || "products";
  const productLabel = settings.product_label || "Products";

  // Find category
  let cat = await prisma.category.findFirst({ where: { slug: catSlug, locale: loc } });
  if (!cat && loc !== "en") {
    const enCat = await prisma.category.findFirst({ where: { slug: catSlug, locale: "en" } });
    if (enCat?.translationGroupId) {
      cat = await prisma.category.findFirst({ where: { translationGroupId: enCat.translationGroupId, locale: loc } });
    }
    if (!cat) cat = enCat;
  }

  // Products with fallback
  let products = await prisma.product.findMany({
    where: { published: true, locale: loc, categories: { some: { slug: catSlug } } },
    include: { categories: true, images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  if (products.length === 0 && loc !== "en") {
    products = await prisma.product.findMany({
      where: { published: true, locale: "en", categories: { some: { slug: catSlug } } },
      include: { categories: true, images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  const name = cat?.name || catSlug;

  return (
    <div style={{ padding: "40px 0" }}>
      <div className="container">
        <Link href={localizeUrl(`/${productRoute}`, loc)} style={{ color: "var(--primary)", fontSize: 14, textDecoration: "none" }}>&larr; All {productLabel}</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "16px 0 8px" }}>{name}</h1>
        <p style={{ color: "#6b7280", marginBottom: 32 }}>{products.length} product{products.length > 1 ? "s" : ""}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
          {products.map((p: any) => {
            const thumb = p.image || p.images?.[0]?.url || null;
            return (
              <Link key={p.id} href={localizeUrl(`/${productRoute}/${cleanSlug(p.slug)}`, loc)}
                style={{ textDecoration: "none", color: "inherit", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <div style={{ height: 220, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {thumb ? <img src={getWebpUrl(thumb)} alt={p.title} style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain", padding: 16 }} />
                    : <span style={{ color: "#9ca3af", fontSize: 13 }}>No image</span>}
                </div>
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.3 }}>{p.title}</h3>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {p.categories?.slice(0, 2).map((c: any) => (
                      <span key={c.slug} style={{ fontSize: 11, background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, color: "#6b7280" }}>{c.name}</span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {products.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af", padding: 60 }}>No products in this category.</p>}
      </div>
    </div>
  );
}

// ── Main page handler ────────────────────────
export default async function Page({ params }: Props) {
  const { locale, path } = parse(params.segments || []);
  const loc = locale;
  const settings = await getSiteSettings();

  // Homepage
  if (!path || path === "/") return renderPage("home", loc);

  const slug = path.slice(1);
  const productRoute = settings.product_slug || "products";
  const categoryRoute = settings.category_slug || "categories";

  // Dynamic: /[productRoute]/ → product listing
  if (path === `/${productRoute}/` || path === `/${productRoute}`) {
    return renderProductListing(loc);
  }

  // Dynamic: /[productRoute]/[slug]/ → product detail
  if (path.startsWith(`/${productRoute}/`)) {
    const productSlug = slug.replace(`${productRoute}/`, "");
    const detail = await renderProductDetail(productSlug, loc, settings);
    if (detail) return detail;
  }

  // Dynamic: /[categoryRoute]/[catSlug]/ → category page
  if (path.startsWith(`/${categoryRoute}/`)) {
    const catSlug = slug.replace(`${categoryRoute}/`, "");
    return renderCategoryPage(catSlug, loc, settings);
  }

  // Default: CMS page
  return renderPage(slug, loc);
}
